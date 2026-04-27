// Curated top picks for event location inspiration.
// DC = local picks (the LinkUp team is GW, so DC is "home").
// Global = bucket-list spots for trip-style events.

export type Pick = {
  name: string;
  category: "Restaurant" | "Bar" | "Park" | "Museum" | "Landmark" | "Neighborhood" | "Activity";
  area: string; // neighborhood (DC) or city, country (global)
  blurb: string;
  emoji: string;
};

export const DC_PICKS: Pick[] = [
  { name: "Le Diplomate", category: "Restaurant", area: "14th St / Logan Circle", blurb: "Classic French brasserie — go-to brunch spot.", emoji: "🥐" },
  { name: "Rose's Luxury", category: "Restaurant", area: "Barracks Row", blurb: "James Beard winner, no-reservations small plates.", emoji: "🌹" },
  { name: "Founding Farmers", category: "Restaurant", area: "Foggy Bottom", blurb: "Farm-to-table classic right by GW campus.", emoji: "🌾" },
  { name: "Tiger Fork", category: "Restaurant", area: "Blagden Alley", blurb: "Hong Kong–style street food in a hidden alley.", emoji: "🐯" },
  { name: "Wundergarten", category: "Bar", area: "NoMa", blurb: "Outdoor beer garden — perfect for big groups.", emoji: "🍻" },
  { name: "The Wharf", category: "Neighborhood", area: "Southwest Waterfront", blurb: "Waterfront bars, live music, and fire pits.", emoji: "⚓" },
  { name: "National Mall", category: "Landmark", area: "Downtown", blurb: "Picnics, pickup sports, monuments at sunset.", emoji: "🏛️" },
  { name: "Tidal Basin", category: "Park", area: "West Potomac Park", blurb: "Cherry blossoms in spring, paddle boats in summer.", emoji: "🌸" },
  { name: "Rock Creek Park", category: "Park", area: "Northwest DC", blurb: "Hiking, biking, and a planetarium in the city.", emoji: "🌳" },
  { name: "Smithsonian Museums", category: "Museum", area: "National Mall", blurb: "Free entry — pick one and meet at the steps.", emoji: "🦕" },
  { name: "Georgetown Waterfront", category: "Neighborhood", area: "Georgetown", blurb: "Kayaking on the Potomac, then dinner on M St.", emoji: "🛶" },
  { name: "Union Market", category: "Activity", area: "NoMa", blurb: "Food hall + rooftop bar — easy any-weather hang.", emoji: "🍜" },
];

export const GLOBAL_PICKS: Pick[] = [
  { name: "Shibuya Crossing", category: "Landmark", area: "Tokyo, Japan", blurb: "World's busiest crosswalk — start the Tokyo trip here.", emoji: "🗼" },
  { name: "Pike Place Market", category: "Activity", area: "Seattle, USA", blurb: "Fish-throwing, the original Starbucks, harbor views.", emoji: "🐟" },
  { name: "Park Güell", category: "Park", area: "Barcelona, Spain", blurb: "Gaudí mosaics overlooking the Mediterranean.", emoji: "🦎" },
  { name: "Borough Market", category: "Restaurant", area: "London, UK", blurb: "1,000-year-old food market under a Victorian roof.", emoji: "🥖" },
  { name: "Sacré-Cœur", category: "Landmark", area: "Paris, France", blurb: "Best skyline view in Paris — bring wine.", emoji: "🥖" },
  { name: "Tulum Cenotes", category: "Activity", area: "Tulum, Mexico", blurb: "Swim in underground freshwater caves.", emoji: "🌊" },
  { name: "Chinatown Hawker Centres", category: "Restaurant", area: "Singapore", blurb: "Michelin-starred meals for under $10.", emoji: "🍜" },
  { name: "Blue Lagoon", category: "Activity", area: "Reykjavík, Iceland", blurb: "Geothermal soak after a Northern Lights night.", emoji: "♨️" },
  { name: "Central Park", category: "Park", area: "New York City, USA", blurb: "843 acres of picnic spots, boating, and Shakespeare.", emoji: "🍎" },
  { name: "Bondi to Coogee Walk", category: "Activity", area: "Sydney, Australia", blurb: "Coastal cliff walk past 6 beaches.", emoji: "🏖️" },
  { name: "Trastevere", category: "Neighborhood", area: "Rome, Italy", blurb: "Cobblestone aperitivo crawl, 7 PM start.", emoji: "🍝" },
  { name: "Marrakech Souks", category: "Activity", area: "Marrakech, Morocco", blurb: "Spice markets, mint tea, and rooftop sunsets.", emoji: "🕌" },
];
