export interface Trainee {
  id: number;
  ATT_NO: number;
  REG_NO: string;
  name: string;
  NIC_NO: string;
  contact_no: number;
  program: string;
  institute: string;
  training_period: string;
  start_date: string;
  end_date: string;
  schedules: Schedule[];
}

interface Schedule {
  name: string;
  start_date: string;
  end_date: string;
}
