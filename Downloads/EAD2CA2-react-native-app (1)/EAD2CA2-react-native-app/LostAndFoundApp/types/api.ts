export interface ItemCreateDTO {
  name: string;
  description: string;
  category: string;
  location: string;
  date: string;
  isLost: boolean;
  isSolved: boolean;
  imageUrl?: string;
}

export interface ItemResponseDTO {
  id: number;
  name: string;
  description: string;
  category: string;
  location: string;
  date: string;
  isLost: boolean;
  isSolved: boolean;
  imageUrl?: string;
  userId: number;
  username: string;
}

export interface ItemUpdateDTO {
  name?: string;
  description?: string;
  category?: string;
  location?: string;
  date?: string;
  isLost?: boolean;
  isSolved?: boolean;
  imageUrl?: string;
}

export interface UserRegisterDTO {
  username: string;
  email: string;
  password: string;
}

export interface UserLoginDTO {
  username: string;
  password: string;
}

export interface UserResponseDTO {
  id: number;
  username: string;
  email: string;
  token: string;
} 