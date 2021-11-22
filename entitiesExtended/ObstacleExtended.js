import * as YUKA from 'yuka'

class ObstacleExtended extends YUKA.GameEntity {

    constructor(geometry = new YUKA.MeshGeometry()) {

        super();

        this.geometry = geometry;

    }

    lineOfSightTest(ray, intersectionPoint) {

        return this.geometry.intersectRay(ray, this.worldMatrix, true, intersectionPoint);

    }

}

export { ObstacleExtended };
