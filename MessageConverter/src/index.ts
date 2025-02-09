import { SpherePrimitive, SceneUpdate, CubePrimitive } from "@foxglove/schemas";
import { ExtensionContext } from "@foxglove/studio";
import { EnemyInfo } from "./EnemyInfo";  // 导入自定义消息类型
import { PoseArray } from "./PoseStamped";  // 导入 PoseArray 消息类型

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
  return Math.atan2(dy, dx);
}

// 转换 EnemyInfo 为 SceneUpdate
function convertEnemyInfo(inputMessage: EnemyInfo): SceneUpdate {
  const { armor1, armor2, armor3, armor4, center } = inputMessage;

  const yaw = calculateYaw(armor1, center);
  const pitch = -75 * Math.PI / 180;
  const orientation = eulerToQuaternion(pitch, yaw, 0);

  const rectangle: CubePrimitive = {
    pose: {
      position: armor1.pose.position,
      orientation: orientation,
    },
    size: { x: 0.125, y: 0.15, z: 0.05 },
    color: { r: 1, g: 0, b: 0, a: 1 },
  };

  const spherePrimitive = (pose: any, isCenter: boolean) => ({
    pose: {
      position: pose.pose.position,
      orientation: pose.pose.orientation || { x: 0, y: 0, z: 0, w: 1 },
    },
    size: { x: 0.1, y: 0.1, z: 0.1 },
    color: isCenter ? { r: 0, g: 0, b: 1, a: 1 } : { r: 1, g: 0, b: 0, a: 1 },
  });

  const spherePrimitives: SpherePrimitive[] = [
    spherePrimitive(armor1, true),
    spherePrimitive(armor2, false),
    spherePrimitive(armor3, false),
    spherePrimitive(armor4, false),
    spherePrimitive(center, true),
  ];

  return {
    deletions: [],
    entities: [
      {
        id: "enemy-info",
        timestamp: armor1.header.stamp,
        frame_id: armor1.header.frame_id,
        lifetime: { sec: 10, nsec: 0 },
        frame_locked: false,
        metadata: [],
        arrows: [],
        cubes: [rectangle],
        spheres: spherePrimitives,
        cylinders: [],
        lines: [],
        triangles: [],
        texts: [],
        models: [],
      },
    ],
  };
}

// 转换 PoseArray 为 SceneUpdate
function convertPoseArray(inputMessage: PoseArray): SceneUpdate {
  const spheres: SpherePrimitive[] = inputMessage.poses.map((pose) => ({
    pose: {
      position: pose.position,
      orientation: pose.orientation || { x: 0, y: 0, z: 0, w: 1 },
    },
    size: { x: 0.1, y: 0.1, z: 0.1 },
    color: { r: 0, g: 1, b: 0, a: 1 }, // 绿色球体
  }));

  return {
    deletions: [],
    entities: [
      {
        id: "pose-array",
        timestamp: inputMessage.header.stamp,
        frame_id: inputMessage.header.frame_id,
        lifetime: { sec: 10, nsec: 0 },
        frame_locked: false,
        metadata: [],
        arrows: [],
        cubes: [],
        spheres: spheres,
        cylinders: [],
        lines: [],
        triangles: [],
        texts: [],
        models: [],
      },
    ],
  };
}

export function activate(extensionContext: ExtensionContext) {
  extensionContext.registerMessageConverter({
    fromSchemaName: "robot_msgs/msg/EnemyInfo",
    toSchemaName: "foxglove.SceneUpdate",
    converter: convertEnemyInfo,
  });

  extensionContext.registerMessageConverter({
    fromSchemaName: "geometry_msgs/msg/PoseArray",
    toSchemaName: "foxglove.SceneUpdate",
    converter: convertPoseArray,
  });
}
