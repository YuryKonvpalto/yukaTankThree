import * as THREE from "three";

let terrainHeight = 100

export let enemiesSetup = {

    platoons: {

        guns: [
            {
                number: { pak38: 3, canAskHelp: true },
                positions: [
                    new THREE.Vector3(120, 40, -terrainHeight / 2 - 180),
                    // new THREE.Vector3()
                ]
            },

            {
                number: { pak38: 5, canAskHelp: true },
                positions: [
                    new THREE.Vector3(-100, 40, -terrainHeight / 2 - 160),
                    // new THREE.Vector3()
                ]
            },

            // {
            //     number: { pak38: 2, canAskHelp: true },
            //     positions: [
            //         new THREE.Vector3(300, 40, terrainHeight / 2 - 40),
            //         // new THREE.Vector3()
            //     ]
            // },

        ],

        tanks: [
            // {
            //     number: { tigerI: 2, marder2: 2, t34: 2, supportPlatoon: true },
            //     positions: [
            //         new THREE.Vector3(300, 40, terrainHeight / 2 - 40),
            //         // new THREE.Vector3()
            //     ],

            // },

            {
                number: { tigerI: 3, marder2: 3, t34: 2, supportPlatoon: true, canAskHelp: true },
                positions: [
                    new THREE.Vector3(-100, 40, -terrainHeight / 2 - 280),
                    // new THREE.Vector3()
                ],

            },

            {
                number: { tigerI: 3, marder2: 3, t34: 2, supportPlatoon: true, canAskHelp: true },
                positions: [
                    new THREE.Vector3(120, 40, -terrainHeight / 2 - 240),
                    // new THREE.Vector3()
                ]
            },

            // {
            //     number: { tigerI: 2, marder2: 2 },
            //     positions: [
            //         new THREE.Vector3(40, 40, -terrainHeight / 2 - 100),
            //         // new THREE.Vector3()
            //     ]
            // },

        ],

    }

}