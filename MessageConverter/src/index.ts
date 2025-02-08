import { SpherePrimitive, SceneUpdate, CubePrimitive } from "@foxglove/schemas";
import { ExtensionContext } from "@foxglove/studio";
import { EnemyInfo } from "./EnemyInfo";  // 导入自定义消息类型

// 四元数转换函数
function eulerToQuaternion(pitch: number, yaw: number, roll: number) {
  let cy = Math.cos(yaw * 0.5);
  let sy = Math.sin(yaw * 0.5);
  let cr = Math.cos(roll * 0.5);
  let sr = Math.sin(roll * 0.5);
  let cp = Math.cos(pitch * 0.5);
  let sp = Math.sin(pitch * 0.5);

  let qx = cy * sr * cp - sy * cr * sp;
  let qy = cy * cr * sp + sy * sr * cp;
  let qz = sy * cr * cp - cy * sr * sp;
  let qw = cy * cr * cp + sy * sr * sp;

  return { x: qx, y: qy, z: qz, w: qw };
}

// 计算 yaw 角度：根据两个位置的夹角（1号装甲板与敌人中心）
function calculateYaw(armor1: any, center: any): number {
  const dx = center.pose.position.x - armor1.pose.position.x;
  const dy = center.pose.position.y - armor1.pose.position.y;
  return Math.atan2(dy, dx);  // 使用 atan2 来计算夹角
}

// 转换函数，将 EnemyInfo 转换为 SceneUpdate
function convertEnemyInfo(inputMessage: EnemyInfo): SceneUpdate {
  const { armor1, armor2, armor3, armor4, center } = inputMessage;

  // 计算 yaw 和 pitch 角度
  const yaw = calculateYaw(armor1, center);
  const pitch = - 75 *Math.PI / 180;  // 15度 (以弧度表示)

  // 使用欧拉角转换为四元数
  const orientation = eulerToQuaternion(pitch, yaw, 0); // roll 固定为 0

  // 绘制矩形
  const rectangle: CubePrimitive = {
    pose: {
      position: {
        x: armor1.pose.position.x,
        y: armor1.pose.position.y,
        z: armor1.pose.position.z,
      },
      orientation: orientation,  // 使用计算出来的四元数
    },
    size: { x: 0.125, y: 0.15, z: 0.05 },  // 假设长方体的尺寸为 1x2x0.5
    color: { r: 1, g: 0, b: 0, a: 1 }, 
  };

  // 用球体表示每个坐标点的函数
  const spherePrimitive = (pose: any, isCenter: boolean) => ({
    pose: {
      position: {
        x: pose.pose.position.x,
        y: pose.pose.position.y,
        z: pose.pose.position.z,
      },
      orientation: {
        x: pose.pose.orientation.x || 0,
        y: pose.pose.orientation.y || 0,
        z: pose.pose.orientation.z || 0,
        w: pose.pose.orientation.w || 1,
      },
    },
    size: { x: 0.1, y: 0.1, z: 0.1 }, 
    color: isCenter ? { r: 0, g: 0, b: 1, a: 1 } : { r: 1, g: 0, b: 0, a: 1 }, 
  });

  // 为每个 armor 和 center 创建球体，center 的球体颜色为蓝色
  const spherePrimitives: SpherePrimitive[] = [
    spherePrimitive(armor1, true),
    spherePrimitive(armor2, false),
    spherePrimitive(armor3, false),
    spherePrimitive(armor4, false),
    spherePrimitive(center, true),  // center 的球体为蓝色
  ];

  const sceneUpdateMessage: SceneUpdate = {
    deletions: [],
    entities: [
      {
        id: "enemy-info",  // 设置唯一标识符
        timestamp: armor1.header.stamp,  // 使用第一个 armor 的时间戳
        frame_id: armor1.header.frame_id,  // 使用第一个 armor 的坐标系
        lifetime: { sec: 10, nsec: 0 },  // 设置可视化消息的生命周期
        frame_locked: false,
        metadata: [],
        arrows: [],
        cubes: [rectangle],  // 添加矩形到场景
        spheres: spherePrimitives,  // 添加球体到场景
        cylinders: [],
        lines: [],
        triangles: [],
        texts: [],
        models: [],
      },
    ],
  };

  return sceneUpdateMessage;
}

export function activate(extensionContext: ExtensionContext) {
  extensionContext.registerMessageConverter({
    fromSchemaName: "robot_msgs/msg/EnemyInfo",  // ROS 消息类型
    toSchemaName: "foxglove.SceneUpdate",    // 转换为 Foxglove 的可视化消息类型
    converter: convertEnemyInfo,  // 转换函数
  });
}
