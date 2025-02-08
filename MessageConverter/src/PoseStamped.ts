export interface Header {
    stamp: { sec: number, nsec: number };  // 时间戳
    frame_id: string;  // 坐标系
  }
  
  // Pose 类型 (包含位置和方向)
  export interface Pose {
    position: { x: number, y: number, z: number };  // 位置
    orientation: { x: number, y: number, z: number, w: number };  // 姿态 (四元数)
  }
  
  // PoseStamped 类型 (包含 header 和 pose)
  export interface PoseStamped {
    header: Header;
    pose: Pose;
  }