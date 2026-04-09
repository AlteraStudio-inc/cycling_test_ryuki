export type Role = "admin" | "employee";

export type Profile = {
  id: string;
  role: Role;
  name: string;
  employee_code: string | null;
  phone: string | null;
  department: string | null;
  status: string | null;
};

export type Shift = {
  id: string;
  employee_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  note: string | null;
};

export type ChatRoom = {
  id: string;
  room_type: "global" | "direct";
};

export type Message = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_flag: boolean;
};
