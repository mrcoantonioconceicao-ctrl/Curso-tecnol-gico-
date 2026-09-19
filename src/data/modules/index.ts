import { ModuleData } from '../../types';
import { m1McpData } from './m1_mcp';
import { m2GraphRagData } from './m2_graphrag';
import { m3FinetuningData } from './m3_finetuning';
import { m4M5CleanCodeData } from './m4_m5_cleancode';
import { m6BpmnData } from './m6_bpmn';
import { m7M8DddData } from './m7_m8_ddd';
import { capstoneData, finalExamQuestions } from './capstone';

export const allModules: ModuleData[] = [
  m1McpData,
  m2GraphRagData,
  m3FinetuningData,
  m4M5CleanCodeData,
  m6BpmnData,
  m7M8DddData,
  capstoneData
];

export {
  m1McpData,
  m2GraphRagData,
  m3FinetuningData,
  m4M5CleanCodeData,
  m6BpmnData,
  m7M8DddData,
  capstoneData,
  finalExamQuestions
};
