export interface Client {
  id: string;
  name: string;
  type: "residential" | "commercial";
  personType: "pf" | "pj";
  cpfCnpj?: string;
  status: "active" | "inactive" | "potential";
  phone: string;
  phoneSecondary?: string;
  email: string;
  emailSecondary?: string;
  website?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state?: string;
  zipCode?: string;
  howMetUs?: string;
  referredBy?: string;
  notes?: string;
  activeProjects: number;
  registrationDate: string;
  avatar?: string;
}

export interface ClientFormData {
  id?: string;
  personType: "pf" | "pj";
  name: string;
  cpfCnpj?: string;
  type: "residential" | "commercial";
  status: "active" | "inactive" | "potential";
  phone: string;
  phoneSecondary?: string;
  email: string;
  emailSecondary?: string;
  website?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state?: string;
  zipCode?: string;
  howMetUs?: string;
  referredBy?: string;
  notes?: string;
}
