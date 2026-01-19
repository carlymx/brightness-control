const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Settings = imports.ui.settings;
const St = imports.gi.St;
const Gettext = imports.gettext;

/*
 * Brightness Control Applet for Cinnamon
 * Author: carlymx
 * Date: 2025-12-26
 * Version: 1.2.0
 */

const VCP = {
    BRIGHTNESS: "10",
    RED: "16",
    GREEN: "18",
    BLUE: "1A",
    COLOR_PRESET: "14"
};

const DDCUTIL = {
    USER_MODE: "0x0b",
    DEFAULT_TEMP: "0x05"
};

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
        this._ddcutilUserModeActive = false;

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

        let targets = this._getMonitorTargets();

        this._resetXrandr(targets);

        if (this.useDdcutil) {
            for (let target of targets) {
                if (target !== "auto") {
                    let idx = this._monitors.indexOf(target) + 1;
                    GLib.spawn_command_line_sync(`ddcutil -d ${idx} setvcp ${VCP.COLOR_PRESET} ${DDCUTIL.DEFAULT_TEMP}`);
                    GLib.spawn_command_line_sync(`ddcutil -d ${idx} setvcp ${VCP.BRIGHTNESS} 100`);
                } else {
                    GLib.spawn_command_line_sync(`ddcutil setvcp ${VCP.COLOR_PRESET} ${DDCUTIL.DEFAULT_TEMP}`);
                    GLib.spawn_command_line_sync(`ddcutil setvcp ${VCP.BRIGHTNESS} 100`);
                }
            }
            this._ddcutilUserModeActive = false;
        }

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

    _getMonitorTargets: function() {
        if (this.selectedMonitor !== "auto") {
            return [this.selectedMonitor];
        }
        return this._monitors;
    },

    _getDdcutilCommand: function(vcpCode, value, target) {
        if (target !== "auto") {
            let idx = this._monitors.indexOf(target) + 1;
            return `ddcutil -d ${idx} setvcp ${vcpCode} ${value}`;
        }
        return `ddcutil setvcp ${vcpCode} ${value}`;
    },

    _setBrightness: function(value) {
        this._saveValues();

        if (this.useDdcutil) {
            this._setBrightnessDdcutil(value);
        } else {
            this._setBrightnessXrandr(value);
        }
    },

    _setBrightnessDdcutil: function(value) {
        let targets = this._getMonitorTargets();
        this._resetXrandr(targets);

        for (let target of targets) {
            let cmd = this._getDdcutilCommand(VCP.BRIGHTNESS, value, target);
            GLib.spawn_command_line_sync(cmd);
        }
    },

    _setBrightnessXrandr: function(value) {
        let targets = this._getMonitorTargets();
        let brightnessNormalized = value / 100;
        let tempValue = this._tempSlider._value;
        let rgb = this._calcularRGBDesdeTemperatura(tempValue);

        for (let target of targets) {
            let cmd = `xrandr --output ${target} --brightness ${brightnessNormalized} --gamma ${rgb.red}:${rgb.green}:${rgb.blue}`;
            GLib.spawn_command_line_sync(cmd);
        }
    },

    _resetXrandr: function(targets) {
        for (let target of targets) {
            GLib.spawn_command_line_sync(`xrandr --output ${target} --gamma 1:1:1`);
            GLib.spawn_command_line_sync(`xrandr --output ${target} --brightness 1.0`);
        }
    },

    _calcularRGBDesdeTemperatura: function(value) {
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

        return { red: red, green: green, blue: blue };
    },

    _setTemperature: function(value) {
        this._saveValues();

        if (this.useDdcutil) {
            this._setTemperatureDdcutil(value);
        } else {
            this._setTemperatureXrandr(value);
        }
    },

    _setTemperatureDdcutil: function(value) {
        let targets = this._getMonitorTargets();
        let rgb = this._calcularRGBDesdeTemperatura(value);

        this._resetXrandr(targets);
        this._activarModoUsuarioDdcutil(targets);

        for (let target of targets) {
            GLib.spawn_command_line_sync(this._getDdcutilCommand(VCP.RED, Math.round(rgb.red * 100), target));
            GLib.spawn_command_line_sync(this._getDdcutilCommand(VCP.GREEN, Math.round(rgb.green * 100), target));
            GLib.spawn_command_line_sync(this._getDdcutilCommand(VCP.BLUE, Math.round(rgb.blue * 100), target));
        }
    },

    _activarModoUsuarioDdcutil: function(targets) {
        if (this._ddcutilUserModeActive) return;

        for (let target of targets) {
            let cmd = this._getDdcutilCommand(VCP.COLOR_PRESET, DDCUTIL.USER_MODE, target);
            GLib.spawn_command_line_sync(cmd);
        }

        this._ddcutilUserModeActive = true;

        try {
            if (global.notify_notification_new) {
                global.notify_notification_new(_("Brillo Control"), _("Modo de control manual de temperatura activado (User 1)"), "display-brightness");
            } else if (global.log) {
                global.log("Brightness Control: Modo User 1 de ddcutil activado");
            }
        } catch (e) {
            global.log("Brightness Control: Modo User 1 de ddcutil activado");
        }
    },

    _setTemperatureXrandr: function(value) {
        let targets = this._getMonitorTargets();
        let rgb = this._calcularRGBDesdeTemperatura(value);
        let brightnessNormalized = this._brightnessSlider._value;

        for (let target of targets) {
            let cmd = `xrandr --output ${target} --brightness ${brightnessNormalized} --gamma ${rgb.red}:${rgb.green}:${rgb.blue}`;
            GLib.spawn_command_line_sync(cmd);
        }
    },

    _onOpenGitHubClicked: function() {
        GLib.spawn_command_line_sync("xdg-open https://github.com/carlymx/brightness-control");
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
