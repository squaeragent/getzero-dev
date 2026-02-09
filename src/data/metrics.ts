import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const clusterMemory = path.resolve(process.env.HOME || '~', 'Cluster_Memory');

function loadYaml(filePath: string): any {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return yaml.load(content);
  } catch {
    return {};
  }
}

export const realMetrics = loadYaml(path.join(clusterMemory, '00_SYSTEM', 'real_metrics.yaml'));
export const worldState = loadYaml(path.join(clusterMemory, '00_SYSTEM', 'world_state.yaml'));

// Convenience accessors
export const system = realMetrics.system || {};
export const social = realMetrics.social || {};
export const team = realMetrics.team || [];
export const infrastructure = worldState.infrastructure || {};
export const functions = worldState.functions || {};
export const agi = worldState.agi || {};
export const engines = worldState.engines || {};
export const revenue = worldState.revenue || {};
export const content = worldState.content || {};
export const handoffs = worldState.handoffs || {};
export const problems = worldState.problems || {};
