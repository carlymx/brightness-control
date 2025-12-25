module.exports = [
    {
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "script",
            globals: {
                Applet: "readonly",
                PopupMenu: "readonly",
                GLib: "readonly",
                Gio: "readonly",
                St: "readonly",
                Settings: "readonly",
                Gettext: "readonly",
                _: "readonly",
                global: "readonly"
            }
        },
        rules: {
            "no-console": "off",
            "no-unused-vars": "warn"
        }
    }
];
