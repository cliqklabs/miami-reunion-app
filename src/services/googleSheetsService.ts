// Google Sheets service for Miami Reunion App
// Handles member lookup from Google Sheet

export interface FraternityMember {
  firstName: string;
  lastName: string;
  mobilePhone: string;
  email: string;
  nickname: string;
}

// For now, let's create a simple mock data approach
// You can replace this with actual Google Sheets API later
const MOCK_MEMBERS: FraternityMember[] = [
  {
    firstName: "Mark",
    lastName: "Hernandez", 
    mobilePhone: "9175968323",
    email: "mark@cliqk.com",
    nickname: "Hernie"
  },
  {
    firstName: "Timur",
    lastName: "Colak",
    mobilePhone: "9545361462", 
    email: "timurcolak@comcast.net",
    nickname: "Timur"
  },
  {
    firstName: "Jeff",
    lastName: "Mueller",
    mobilePhone: "6504443232",
    email: "jlr.mueller@gmail.com", 
    nickname: "Leroy"
  },
  {
    firstName: "Tim",
    lastName: "Brien",
    mobilePhone: "9179039851",
    email: "timbrien@gmail.com",
    nickname: "TB"
  },
  {
    firstName: "John",
    lastName: "Arrillaga",
    mobilePhone: "6502699896",
    email: "johnarrillaga@yahoo.com",
    nickname: "Rags"
  },
  {
    firstName: "Jon",
    lastName: "Hawkins", 
    mobilePhone: "4152038533",
    email: "Hawkins.Jon.d@gmail.com",
    nickname: "Hawk"
  },
  {
    firstName: "Scott",
    lastName: "Texeira",
    mobilePhone: "6503876922",
    email: "scott_texeira@stanfordalumni.org",
    nickname: "Stewie"
  },
  {
    firstName: "Michael",
    lastName: "Colglazier",
    mobilePhone: "9493971777",
    email: "Michael.colglazier@mac.com",
    nickname: "Col"
  }
];

export const fetchMemberByEmail = async (email: string): Promise<FraternityMember | null> => {
  try {
    // In development, use mock data directly to avoid API errors
    if (process.env.NODE_ENV !== 'production') {
      console.log('Using mock data for development...');
      const member = MOCK_MEMBERS.find(m => m.email.toLowerCase() === email.toLowerCase());
      return member || null;
    }

    // Production: Use Vercel serverless function
    const apiUrl = `/api/member-lookup?email=${encodeURIComponent(email)}`;
    const response = await fetch(apiUrl);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch member data:', error);
    // Fallback to mock data if API fails
    console.log('Falling back to mock data...');
    const member = MOCK_MEMBERS.find(m => m.email.toLowerCase() === email.toLowerCase());
    return member || null;
  }
};
