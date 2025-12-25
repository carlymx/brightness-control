const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Settings = imports.ui.settings;
const St = imports.gi.St;
const Gettext = imports.gettext;

function _(str) {
    return Gettext.dgettext("brightness-control@carlymx", str);
}

function MyApplet(orientation, panelHeight, instanceId) {
    this._init(orientation, panelHeight, instanceId);
}

MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(orientation, panelHeight, instanceId) {
        Applet.IconApplet.prototype._init.call(this, orientation, panelHeight, instanceId);

        Gettext.bindtextdomain("brightness-control@carlymx", GLib.get_home_dir() + "/.local/share/locale");

        this.settings = new Settings.AppletSettings(this, "brightness-control@carlymx", instanceId);
        this.minBrightness = 30;
        this.settings.bindProperty(Settings.BindingDirection.IN, "min-brightness", "minBrightness", null);

        this.realtimeUpdate = false;
        this.settings.bindProperty(Settings.BindingDirection.IN, "realtime-update", "realtimeUpdate", this._onRealtimeSettingChanged.bind(this));

        this.useDdcutil = true;
        this.settings.bindProperty(Settings.BindingDirection.IN, "use-ddcutil", "useDdcutil", null);

        this.selectedMonitor = "auto";
        this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "selected-monitor", "selectedMonitor", null);

        this.savedBrightness = 100;
        this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "saved-brightness", "savedBrightness", null);

        this.savedTemperature = 0.5;
        this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "saved-temperature", "savedTemperature", null);

        this._brightnessTimeout = null;
        this._tempTimeout = null;
        this._monitors = [];

        this.set_applet_icon_name("display-brightness");
        this.set_applet_tooltip(_("Control de Brillo"));

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        let brightnessHeader = new PopupMenu.PopupMenuItem(_("☀  Brillo"));
        brightnessHeader.actor.add_style_class_name('popup-menu-header');
        this.menu.addMenuItem(brightnessHeader);

        this._brightnessSlider = new PopupMenu.PopupSliderMenuItem(0.5);
        this.menu.addMenuItem(this._brightnessSlider);

        this._brightnessLabel = new PopupMenu.PopupMenuItem(_("Brillo: 50%"));
        this._brightnessLabel.setSensitive(false);
        this.menu.addMenuItem(this._brightnessLabel);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        let tempHeader = new PopupMenu.PopupMenuItem(_("🌙  Temperatura"));
        tempHeader.actor.add_style_class_name('popup-menu-header');
        this.menu.addMenuItem(tempHeader);

        this._tempSlider = new PopupMenu.PopupSliderMenuItem(0.5);
        this.menu.addMenuItem(this._tempSlider);

        this._tempLabel = new PopupMenu.PopupMenuItem(_("Temperatura: Natural"));
        this._tempLabel.setSensitive(false);
        this.menu.addMenuItem(this._tempLabel);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._monitorLabel = new PopupMenu.PopupMenuItem(_("Monitor: Auto"));
        this._monitorLabel.setSensitive(false);
        this.menu.addMenuItem(this._monitorLabel);

        this._cycleMonitorButton = new PopupMenu.PopupIconMenuItem(_("Cambiar Monitor"), "video-display", St.IconType.SYMBOLIC);
        this._cycleMonitorButton.connect('activate', this._cycleMonitor.bind(this));
        this.menu.addMenuItem(this._cycleMonitorButton);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._resetButton = new PopupMenu.PopupIconMenuItem(_("Restablecer"), "edit-undo", St.IconType.SYMBOLIC);
        this._resetButton.connect('activate', this._resetToDefaults.bind(this));
        this.menu.addMenuItem(this._resetButton);

        this._detectMonitors();
        this._connectSliderEvents();
        this._loadSavedValues();
    },

    on_applet_clicked: function(event) {
        this.menu.toggle();
    },

    _onSliderChanged: function(slider) {
        let brightness = Math.round(slider._value * 100);
        if (brightness < this.minBrightness) {
            brightness = this.minBrightness;
            slider._value = this.minBrightness / 100;
        }
        this._setBrightness(brightness);
    },

    _onSliderValueChanged: function(slider, value) {
        let brightness = Math.round(value * 100);
        if (brightness < this.minBrightness) {
            brightness = this.minBrightness;
            slider._value = this.minBrightness / 100;
        }
        this._brightnessLabel.label.text = _("Brillo: ") + brightness + "%";
    },

    _onTempChanged: function(slider) {
        let value = slider._value;
        this._setTemperature(value);
    },

    _onTempValueChanged: function(slider, value) {
        let warmPercent = Math.round((1.0 - value) * 100);
        let coldPercent = Math.round(value * 100);
        this._tempLabel.label.text = warmPercent + "% - Luz cálida - 0 - Luz fría " + coldPercent + "%";
    },

    _onRealtimeSettingChanged: function() {
        this._disconnectSliderEvents();
        this._connectSliderEvents();
    },

    _connectSliderEvents: function() {
        if (this.realtimeUpdate) {
            this._brightnessDragEndId = this._brightnessSlider.connect('drag-end', this._onSliderChanged.bind(this));
            this._brightnessValueChangedId = this._brightnessSlider.connect('value-changed', this._debouncedOnSliderChanged.bind(this));
            this._tempDragEndId = this._tempSlider.connect('drag-end', this._onTempChanged.bind(this));
            this._tempValueChangedId = this._tempSlider.connect('value-changed', this._debouncedOnTempChanged.bind(this));
        } else {
            this._brightnessDragEndId = this._brightnessSlider.connect('drag-end', this._onSliderChanged.bind(this));
            this._brightnessValueChangedId = this._brightnessSlider.connect('value-changed', this._onSliderValueChanged.bind(this));
            this._tempDragEndId = this._tempSlider.connect('drag-end', this._onTempChanged.bind(this));
            this._tempValueChangedId = this._tempSlider.connect('value-changed', this._onTempValueChanged.bind(this));
        }
    },

    _disconnectSliderEvents: function() {
        if (this._brightnessDragEndId) {
            this._brightnessSlider.disconnect(this._brightnessDragEndId);
            this._brightnessDragEndId = null;
        }
        if (this._brightnessValueChangedId) {
            this._brightnessSlider.disconnect(this._brightnessValueChangedId);
            this._brightnessValueChangedId = null;
        }
        if (this._tempDragEndId) {
            this._tempSlider.disconnect(this._tempDragEndId);
            this._tempDragEndId = null;
        }
        if (this._tempValueChangedId) {
            this._tempSlider.disconnect(this._tempValueChangedId);
            this._tempValueChangedId = null;
        }
    },

    _debouncedOnSliderChanged: function(slider, value) {
        this._onSliderValueChanged(slider, value);
        if (this._brightnessTimeout) {
            GLib.source_remove(this._brightnessTimeout);
        }
        let brightness = Math.round(value * 100);
        if (brightness < this.minBrightness) {
            brightness = this.minBrightness;
            slider._value = this.minBrightness / 100;
        }
        this._brightnessTimeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 150, function() {
            this._setBrightness(brightness);
            this._brightnessTimeout = null;
            return GLib.SOURCE_REMOVE;
        }.bind(this));
    },

    _debouncedOnTempChanged: function(slider, value) {
        this._onTempValueChanged(slider, value);
        if (this._tempTimeout) {
            GLib.source_remove(this._tempTimeout);
        }
        this._tempTimeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 150, function() {
            this._setTemperature(value);
            this._tempTimeout = null;
            return GLib.SOURCE_REMOVE;
        }.bind(this));
    },

    _resetToDefaults: function() {
        this._brightnessSlider.setValue(1.0);
        this._tempSlider.setValue(0.5);
        this._brightnessLabel.label.text = _("Brillo: 100%");
        let warmPercent = Math.round((1.0 - 0.5) * 100);
        let coldPercent = Math.round(0.5 * 100);
        this._tempLabel.label.text = warmPercent + "% - Luz cálida - 0 - Luz fría " + coldPercent + "%";
        this.selectedMonitor = "auto";
        this.settings.setValue("selected-monitor", "auto");
        this._updateMonitorLabel();
        this._setBrightness(100);
    },

    _cleanupTimeouts: function() {
        if (this._brightnessTimeout) {
            GLib.source_remove(this._brightnessTimeout);
            this._brightnessTimeout = null;
        }
        if (this._tempTimeout) {
            GLib.source_remove(this._tempTimeout);
            this._tempTimeout = null;
        }
    },

    _loadStylesheet: function() {
        try {
            let themeContext = St.ThemeContext.get_for_stage(global.stage);
            let theme = themeContext.get_theme();
            if (theme) {
                let stylesheetPath = GLib.get_home_dir() + "/.local/share/cinnamon/applets/brightness-control@carlymx/stylesheet.css";
                let file = Gio.File.new_for_path(stylesheetPath);
                if (file.query_exists(null)) {
                    theme.load_stylesheet(file);
                }
            }
        } catch (e) {
            global.logError("Error cargando stylesheet:", e);
        }
    },

    _detectMonitors: function() {
        try {
            let [success, xrandrOutput, xrandrError] = GLib.spawn_command_line_sync("xrandr --current");
            if (success) {
                let lines = String(xrandrOutput).split('\n');
                this._monitors = [];

                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes(' connected')) {
                        let parts = lines[i].split(' ');
                        let monitorName = parts[0];
                        this._monitors.push(monitorName);
                    }
                }

                if (this._monitors.length > 0) {
                    this._updateMonitorLabel();
                }
            }
        } catch (e) {
            global.logError("Error detectando monitores:", e);
        }
    },

    _updateMonitorLabel: function() {
        let display = this.selectedMonitor === "auto" ? "Auto" : this.selectedMonitor;
        this._monitorLabel.label.text = _("Monitor: ") + display;
    },

    _cycleMonitor: function() {
        if (this._monitors.length === 0) return;

        let currentIndex = this._monitors.indexOf(this.selectedMonitor);
        if (currentIndex === -1 && this.selectedMonitor === "auto") {
            currentIndex = -1;
        }

        if (currentIndex < this._monitors.length - 1) {
            this.selectedMonitor = this._monitors[currentIndex + 1];
        } else {
            this.selectedMonitor = "auto";
        }

        this.settings.setValue("selected-monitor", this.selectedMonitor);
        this._updateMonitorLabel();
    },

    _loadSavedValues: function() {
        this._brightnessSlider.setValue(this.savedBrightness / 100);
        this._tempSlider.setValue(this.savedTemperature);
        this._brightnessLabel.label.text = _("Brillo: ") + Math.round(this.savedBrightness) + "%";

        let warmPercent = Math.round((1.0 - this.savedTemperature) * 100);
        let coldPercent = Math.round(this.savedTemperature * 100);
        this._tempLabel.label.text = warmPercent + "% - Luz cálida - 0 - Luz fría " + coldPercent + "%";
    },

    _saveValues: function() {
        this.savedBrightness = Math.round(this._brightnessSlider._value * 100);
        this.savedTemperature = this._tempSlider._value;
    },

    _getCurrentBrightness: function() {
        if (this.useDdcutil) {
            try {
                let cmd = "ddcutil getvcp 10";
                if (this.selectedMonitor !== "auto") {
                    let monitorIndex = this._monitors.indexOf(this.selectedMonitor);
                    if (monitorIndex !== -1) {
                        cmd = `ddcutil -d ${monitorIndex + 1} getvcp 10`;
                    }
                }

                let [success, stdout, stderr] = GLib.spawn_command_line_sync(cmd);
                if (success) {
                    let output = String(stdout);
                    let match = output.match(/current value = ([0-9]+)/);
                    if (match) {
                        let value = parseInt(match[1]);
                        let normalized = value / 100;
                        this._brightnessSlider.setValue(normalized);
                        this._brightnessLabel.label.text = _("Brillo: ") + value + "%";
                    }
                }
            } catch (e) {
                global.logError("Error obteniendo brillo actual:", e);
            }
        }
    },

    _setBrightness: function(value) {
        this._saveValues();

        if (this.useDdcutil) {
            try {
                let cmd = `ddcutil setvcp 10 ${value}`;
                if (this.selectedMonitor !== "auto") {
                    let monitorIndex = this._monitors.indexOf(this.selectedMonitor);
                    if (monitorIndex !== -1) {
                        cmd = `ddcutil -d ${monitorIndex + 1} setvcp 10 ${value}`;
                    }
                }

                let [success, stdout, stderr] = GLib.spawn_command_line_sync(cmd);
                if (!success) {
                    global.logError("Error ejecutando ddcutil:", stderr);
                    this._setXrandrBrightness(value);
                }
            } catch (e) {
                global.logError("Excepción ejecutando ddcutil:", e);
                this._setXrandrBrightness(value);
            }
        } else {
            this._setXrandrBrightness(value);
        }
    },

    _setXrandrBrightness: function(value) {
        let targets = this._getMonitorTargets();
        let normalized = value / 100;
        let tempValue = this._tempSlider._value;
        let red, green, blue;

        if (tempValue < 0.5) {
            let warmth = 1.0 - (tempValue * 2);
            red = 1.0;
            green = 1.0 - (warmth * 0.1);
            blue = 1.0 - (warmth * 0.5);
        } else {
            let coolness = (tempValue - 0.5) * 2;
            red = 1.0 - (coolness * 0.3);
            green = 1.0 - (coolness * 0.1);
            blue = 1.0;
        }

        let cmdParts = [];
        for (let i = 0; i < targets.length; i++) {
            cmdParts.push(`--output ${targets[i]} --brightness ${normalized} --gamma ${red}:${green}:${blue}`);
        }

        if (cmdParts.length > 0) {
            try {
                let cmd = `xrandr ${cmdParts.join(' ')}`;
                GLib.spawn_command_line_sync(cmd);
            } catch (e) {
                global.logError("Error ejecutando xrandr:", e);
            }
        }
    },

    _getMonitorTargets: function() {
        if (this.selectedMonitor !== "auto") {
            return [this.selectedMonitor];
        }
        return this._monitors;
    },

    _setTemperature: function(value) {
        this._saveValues();
        let targets = this._getMonitorTargets();
        let red, green, blue;

        if (value < 0.5) {
            let warmth = 1.0 - (value * 2);
            red = 1.0;
            green = 1.0 - (warmth * 0.1);
            blue = 1.0 - (warmth * 0.5);
        } else {
            let coolness = (value - 0.5) * 2;
            red = 1.0 - (coolness * 0.3);
            green = 1.0 - (coolness * 0.1);
            blue = 1.0;
        }

        let brightness = this._brightnessSlider._value;
        let brightnessNormalized = brightness;

        let cmdParts = [];
        for (let i = 0; i < targets.length; i++) {
            cmdParts.push(`--output ${targets[i]} --brightness ${brightnessNormalized} --gamma ${red}:${green}:${blue}`);
        }

        if (cmdParts.length > 0) {
            try {
                let cmd = `xrandr ${cmdParts.join(' ')}`;
                GLib.spawn_command_line_sync(cmd);
            } catch (e) {
                global.logError("Error ejecutando xrandr temperatura:", e);
            }
        }
    },

    _setTemperature: function(value) {
        try {
            let [success, xrandrOutput, xrandrError] = GLib.spawn_command_line_sync("xrandr --current");

            if (success) {
                let lines = String(xrandrOutput).split('\n');
                let outputName = null;

                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes(' connected')) {
                        outputName = lines[i].split(' ')[0];
                        break;
                    }
                }

                if (outputName) {
                    let red, green, blue;

                    if (value < 0.5) {
                        let warmth = 1.0 - (value * 2);
                        red = 1.0;
                        green = 1.0 - (warmth * 0.1);
                        blue = 1.0 - (warmth * 0.5);
                    } else {
                        let coolness = (value - 0.5) * 2;
                        red = 1.0 - (coolness * 0.3);
                        green = 1.0 - (coolness * 0.1);
                        blue = 1.0;
                    }

                    let brightness = this._brightnessSlider._value;
                    let brightnessNormalized = brightness;
                    let cmd = `xrandr --output ${outputName} --brightness ${brightnessNormalized} --gamma ${red}:${green}:${blue}`;
                    GLib.spawn_command_line_sync(cmd);
                    global.log("xrandr: temperatura cambiada a", red, green, blue);
                } else {
                    global.logError("No se encontró monitor conectado para temperatura");
                }
            }
        } catch (e) {
            global.logError("Error ejecutando xrandr temperatura:", e);
        }
    },

    _reapplyTemperature: function() {
        let tempValue = this._tempSlider._value;
        this._setTemperature(tempValue);
    },

    destroy: function() {
        this._cleanupTimeouts();
        this._disconnectSliderEvents();
        Applet.IconApplet.prototype.destroy.call(this);
    }
};

function main(metadata, orientation, panelHeight, instanceId) {
    return new MyApplet(orientation, panelHeight, instanceId);
}
