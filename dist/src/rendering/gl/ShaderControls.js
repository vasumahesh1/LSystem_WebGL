export class WaterControls {
    constructor() {
        this.opacity = 0.65;
        this.color = [21.0, 92.0, 158.0];
        this.level = 0.5;
    }
    reset() {
        this.opacity = 0.65;
        this.color = [21.0, 92.0, 158.0];
        this.level = 0.5;
    }
}
export class ShaderControls {
    constructor() {
        this.waterControls = new WaterControls();
        this.sandColor = [237.0, 209.0, 127.0];
        this.bedrock1Color = [68.0, 85.0, 102.0];
        this.bedrock2Color = [34.0, 43.0, 51.0];
        this.shoreLevel = 0.5;
        this.elevation = 0.5;
        this.noiseScale = 0.5;
    }
    reset() {
        this.waterControls.reset();
        this.sandColor = [237.0, 209.0, 127.0];
        this.bedrock1Color = [68.0, 85.0, 102.0];
        this.bedrock2Color = [34.0, 43.0, 51.0];
        this.shoreLevel = 0.5;
        this.elevation = 0.5;
        this.noiseScale = 0.5;
    }
}
export default ShaderControls;
//# sourceMappingURL=ShaderControls.js.map