import * as THREE from "three";

let terrainHeight = 300

///////tanks:
////1 - TigerI
////2 - Marder2

export let axisSetup = {

    platoons: {

        guns: [
            // {
            //     number: { pak38: 0 },
            //     positions: [
            //         new THREE.Vector3(250, 40, terrainHeight / 2 - 140),
            //         // new THREE.Vector3()
            //     ]
            // },

            // {
            //     number: { pak38: 0 },
            //     positions: [
            //         new THREE.Vector3(60, 40, terrainHeight / 2 - 120),
            //         // new THREE.Vector3()
            //     ]
            // },

            // {
            //     number: { pak38: 0 },
            //     positions: [
            //         new THREE.Vector3(90, 40, terrainHeight / 2 - 210),
            //         // new THREE.Vector3()
            //     ]
            // },

        ],

        tanks: [
            {
                number: { tigerI: 0, t34: 0, marder2: 0 },
                positions: [
                    new THREE.Vector3(250, 40, terrainHeight / 2 - 140),
                    // new THREE.Vector3()
                ]
            },

            {
                number: { tigerI: 2, t34: 2, marder2: 2 },
                positions: [
                    new THREE.Vector3(-150, 40, terrainHeight / 2 + 260),
                    // new THREE.Vector3()
                ]
            },


            {
                number: { tigerI: 2, t34: 2, marder2: 2 },
                positions: [
                    // new THREE.Vector3(100, 40, terrainHeight / 2 - 310),///right infront of enemy guns
                    new THREE.Vector3(100, 40, terrainHeight / 2 + 260),
                    // new THREE.Vector3()
                ]
            },

            // {
            //     number: { tigerI: 2, t34: 2, marder2: 2 },
            //     positions: [
            //         new THREE.Vector3(300, 40, terrainHeight / 2 - 60),
            //         // new THREE.Vector3()
            //     ]
            // },


        ]

    }

}