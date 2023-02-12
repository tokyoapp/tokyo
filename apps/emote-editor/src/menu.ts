export default [
    {
        title: "Import Image",
        icon: "Import",
        action: "import.image",
    },
    {
        title: "Export",
        icon: "SaveAs",
        action: null,
        options: [
            {
                title: "Export maxres image",
                action: "export.maxres"
            },
            {
                title: "Export all Emote sizes",
                action: "export.emotes"
            },
            {
                title: "Export all Badge sizes",
                action: "export.badges"
            }
        ]
    },
    {
        title: "Publish",
        icon: "Viewer",
        action: null,
        options: [
            {
                title: "FFZ",
                action: "publish.ffz"
            },
            {
                title: "BTTV",
                action: "publish.bttv"
            }
        ]
    }
]