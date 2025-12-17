import { Category, Team, TeamId } from './types';

export const TEAMS_INITIAL: Team[] = [
  {
    id: TeamId.A,
    name: 'Team Masala',
    score: 0,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    id: TeamId.B,
    name: 'Team Chutney',
    score: 0,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
];

export const CATEGORIES: Category[] = [
  {
    id: 'bollywood',
    name: 'Bollywood',
    icon: '🎬',
    description: 'Movies, Stars, and Dialogues',
    geminiPrompt: 'Bollywood movies, famous actors, actresses, and iconic movie dialogues',
  },
  {
    id: 'food',
    name: 'Desi Food',
    icon: '🍛',
    description: 'Dishes, Sweets, and Snacks',
    geminiPrompt: 'Indian dishes, street food, sweets, spices, and beverages',
  },
  {
    id: 'cricket',
    name: 'Cricket',
    icon: '🏏',
    description: 'Legends, Terms, and Teams',
    geminiPrompt: 'Indian cricket players, famous stadiums, cricket terminology, and IPL teams',
  },
  {
    id: 'festivals',
    name: 'Festivals',
    icon: '🪔',
    description: 'Celebrations and Traditions',
    geminiPrompt: 'Indian festivals, religious holidays, cultural traditions, and wedding rituals',
  },
  {
    id: 'slang',
    name: 'Desi Slang',
    icon: '🗣️',
    description: 'Common colloquialisms and phrases',
    geminiPrompt: 'Popular Indian English slang, Hindi slang used in daily life (e.g., Jugaad, Yaar)',
  },
  {
    id: 'places',
    name: 'Places',
    icon: '🕌',
    description: 'Cities, Monuments, and States',
    geminiPrompt: 'Famous Indian cities, states, monuments, tourist destinations, and landmarks',
  },
];

// Fallback data in case API fails
export const FALLBACK_WORDS = [
  "Biryani", "Shah Rukh Khan", "Sachin Tendulkar", "Taj Mahal", "Diwali",
  "Pani Puri", "Mumbai", "Virat Kohli", "Saree", "Rickshaw",
  "Butter Chicken", "Holi", "Yoga", "Chai", "Bollywood",
  "Ganges", "Monsoon", "Curry", "Namaste", "Auto",
  "Jugaad", "Wedding", "Samosa", "Lassi", "Goa",
  "Dosa", "Idli", "Vada Pav", "Pav Bhaji", "Gulab Jamun",
  "Rasgulla", "Jalebi", "Kareena Kapoor", "Amitabh Bachchan", "Dhoni",
  "IPL", "Kerala", "Jaipur", "Hawa Mahal", "Red Fort",
  "Qutub Minar", "Lotus Temple", "Bangalore", "Traffic", "Horn Please",
  "Bindi", "Mehendi", "Bhangra", "Garba", "Dandiya",
  "Kurta", "Sherwani", "Turban", "Bhai", "Didi",
  "Mummy", "Papa", "Chacha", "Masi", "Laddu",
  "Barfi", "Kaju Katli", "Tandoori", "Naan", "Roti",
  "Dal Makhani", "Paneer", "Palak Paneer", "Chole Bhature", "Rajma Chawal",
  "Train Journey", "Chappal", "Thali", "Achar", "Papad",
  "Cricket Bat", "Wicket", "Sixer", "Umpire", "Gully Cricket"
];

export const TIMER_MIN_DURATION = 45; // seconds
export const TIMER_MAX_DURATION = 60; // seconds
export const WINNING_SCORE_DEFAULT = 7;