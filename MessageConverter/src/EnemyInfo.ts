import { PoseStamped } from "./PoseStamped"; 

// 定义 EnemyInfo 消息类型
export interface EnemyInfo {
  armor1: PoseStamped;
  armor2: PoseStamped;
  armor3: PoseStamped;
  armor4: PoseStamped;
  center: PoseStamped;
}