import {
  vec3,
  mat4,
  vec4
} from 'gl-matrix';

import Stack from '../ds/Stack';

let Noise = require('noisejs').Noise;

var Logger = require('debug');
var dTransform = Logger("lsystem:trace:transform");
var dStack = Logger("lsystem:trace:stack");
var dConstruct = Logger("lsystem:info:construction");

class LSystemSymbol {
  value: string;
  onProcess: any;
  args: any;

  constructor(val: string, fn: any, args: any) {
    this.value = val;
    this.onProcess = fn;
    this.args = args;
  }

  setValue(val: any) {
    this.value = val;
    return this;
  }

  setOnProcess(fn: any) {
    this.onProcess = fn;
    return this;
  }
};

class LSystemRule {
  weight: number = 1.0;

  source: string;
  expr: string;

  constructor(src: string, exp: string) {
    this.source = src;
    this.expr = exp;
  }

  setWeight(value: number) {
    this.weight = value;
    return this;
  }

  setSource(value: string) {
    this.source = value;
    return this;
  }

  setExpr(value: string) {
    this.expr = value;
    return this;
  }  
};

class LSystemRuleSet {
  rules: Array<LSystemRule>;
  totalWeight: number;

  constructor() {
    this.rules = new Array<LSystemRule>();
    this.totalWeight = 0.0;
  }

  addRule(src: string, exp: string) {
    this.rules.push(new LSystemRule(src, exp));
    this.totalWeight += 1.0;
  }

  addWeightedRule(src: string, exp: string, weight: number) {
    this.rules.push(new LSystemRule(src, exp).setWeight(weight));
    this.totalWeight += weight;
  }
}

class LSystemExecutionScope {
  scope: any;
  ops: any;
  noiseGen: any;
  itr: number;
  depth: number;
  rootString: string;
  stack: Stack<LSystemStackEntry>;
  turtle: LSystemTurtle;

  constructor() {
    this.itr = 0;
    this.depth = 1;
    this.rootString = "";
    this.stack = new Stack<LSystemStackEntry>();
    this.turtle = new LSystemTurtle();
  }

  getTurtle() : LSystemTurtle {
    return this.turtle;
  }

  opSaveState() {
    let stackEntry = new LSystemStackEntry(this.turtle);
    this.stack.push(stackEntry);
    dStack(`Saving State (${this.turtle.position[0]}, ${this.turtle.position[1]}, ${this.turtle.position[2]})`);
  }

  opRestoreState() {
    let stackEntry = this.stack.pop();
    this.turtle = LSystemTurtle.fromExisting(stackEntry.turtle);
    dStack(`Restoring State (${this.turtle.position[0]}, ${this.turtle.position[1]}, ${this.turtle.position[2]})`);
  }
};

class LSystemStackEntry {
  turtle: LSystemTurtle;

  constructor(currentTurtle: LSystemTurtle) {
    this.turtle = LSystemTurtle.fromExisting(currentTurtle);
  }
};

class LSystemTurtle {
  position: vec4;
  heading: vec4;
  transform: mat4;

  constructor() {
    this.position = vec4.fromValues(0, 0, 0, 1);
    this.heading = vec4.fromValues(0, 1, 0, 0);
    this.transform = mat4.create();
  }

  applyTransform(m: mat4) {
    vec4.transformMat4(this.position, this.position, m);
    vec4.transformMat4(this.heading, this.heading, m);

    vec4.normalize(this.heading, this.heading);

    mat4.multiply(this.transform, this.transform, m);

    dTransform(`Resultant Heading: (${this.heading[0]}, ${this.heading[1]}, ${this.heading[2]})`);
    dTransform(`Resultant Position: (${this.position[0]}, ${this.position[1]}, ${this.position[2]})`);
    dTransform("Resultant Transform:", this.transform);
  }

  applyTransformPre(m: mat4) {
    mat4.multiply(this.transform, m, this.transform);

    vec4.transformMat4(this.position, vec4.fromValues(0,0,0,1), this.transform);
    vec4.transformMat4(this.heading, vec4.fromValues(0,1,0,0), this.transform);

    vec4.normalize(this.heading, this.heading);

    dTransform(`Resultant Heading: (${this.heading[0]}, ${this.heading[1]}, ${this.heading[2]})`);
    dTransform(`Resultant Position: (${this.position[0]}, ${this.position[1]}, ${this.position[2]})`);
    dTransform("Resultant Transform:", this.transform);
  }

  static fromExisting(src: LSystemTurtle): LSystemTurtle {
    let copy = new LSystemTurtle();
    vec4.copy(copy.position, src.position);
    vec4.copy(copy.heading, src.heading);
    mat4.copy(copy.transform, src.transform);

    return copy;
  }
};

class LSystem {
  rules: { [symbol: string]: LSystemRuleSet; } = { };
  map: { [symbol: string]: LSystemSymbol; } = { };
  axiom: string;
  construction: string;
  execScope: LSystemExecutionScope;
  seed: number;
  noiseGen: any;

  constructor(seed: number) {
    this.seed = seed;

    let noise = new Noise(seed);
    this.noiseGen = noise;
  }

  setAxiom(value: string) {
    this.axiom = value;
    return this;
  }

  addSymbol(value: string, drawCmd: any, args: any) {
    this.map[value] = new LSystemSymbol(value, drawCmd, args);
    return this;
  }

  addRule(src: string, exp: string) {
    if (!this.rules[src]) {
      this.rules[src] = new LSystemRuleSet();
    }

    this.rules[src].addRule(src, exp);

    return this;
  }

  addWeightedRule(src: string, exp: string, weight: number) {
    if (!this.rules[src]) {
      this.rules[src] = new LSystemRuleSet();
    }

    this.rules[src].addWeightedRule(src, exp, weight);

    return this;
  }

  selectRule(ruleSet: LSystemRuleSet) {
    let totalWeight = ruleSet.totalWeight;
    let progress = 0.0;

    if (ruleSet.rules.length == 1) {
      return ruleSet.rules[0];
    }

    let noise = this.noiseGen.simplex2(this.seed * 13, this.seed * 29);

    let ruleIdx: number;
    let random = noise * totalWeight;

    for (var itr = ruleSet.rules.length - 1; itr >= 0; --itr) {
      let rule = ruleSet.rules[itr];
      progress += rule.weight;

      if (progress > random) {
        ruleIdx = itr;
        break;
      }
    }

    return ruleSet.rules[ruleIdx];
  }

  construct(iterations: number) {
    let current = this.axiom;
    for (let itr = iterations - 1; itr >= 0; --itr) {

      let nextString = "";

      for (let stringItr = 0; stringItr < current.length; ++stringItr) {

        let symbol = current[stringItr];
        let symbolRuleSet = this.rules[symbol];

        if (!symbolRuleSet) {
          nextString +=  symbol;
          continue;
        }

        let rule = this.selectRule(symbolRuleSet);
        nextString +=  rule.expr;
      }

      current = nextString;
    }

    dConstruct("Resultant String: " + current);

    this.construction = current;
    return this;
  }

  process(scope: any) {
    let rootString = this.construction;

    this.execScope = new LSystemExecutionScope();
    this.execScope.scope = scope;
    this.execScope.rootString = rootString;
    this.execScope.noiseGen = this.noiseGen;

    for (this.execScope.itr = 0; this.execScope.itr < rootString.length; ++this.execScope.itr) {
      let symbol = rootString[this.execScope.itr];
      let symbolData = this.map[symbol];

      if (!symbolData) {
        continue;
      }

      if (symbolData.onProcess) {
        symbolData.onProcess.apply(this.execScope, symbolData.args);
      }
    }
  }
};

export default LSystem;

export { LSystem, LSystemTurtle };