
const saveState = {
    timeline: {
        scrollX: 0,
        scrollY: 0,
        time: 2.4 * 100,
        selection: [[0, 0], [0, 0]],
    },
    tracks: [
        {
            name: "Track1",
            source: {
                deviceId: 'default',
                channel: 0
            },
            clips: [
                {
                    clip: 0,
                    position: 0,
                }
            ]
        },
        {
            name: "Track2",
            source: {
                deviceId: 'default',
                channel: 0
            }
        }
    ],
    clips: [
        {
            name: "Untitled Clip",
            buffer: 0,
            length: 3,
            offset: 0,
        }
    ],
    buffers: [
        {
            data: []
        }
    ]
}
