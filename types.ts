
export type Section = 'home' | 'learning' | 'sports' | 'entertainment' | 'plan' | 'album';
export type Subject = 'chinese' | 'english' | 'math' | 'science';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  time: string;
}

export interface LearningItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}
