// In a real app, these values would be more complex and possibly fetched from an API.
// Units are in kg CO₂ per unit (km, kWh, serving).

export const EMISSION_FACTORS = {
  travel: {
    car_gasoline: 0.2, // kg CO₂ per km
    flight_short: 0.25, // kg CO₂ per km
    bus: 0.08, // kg CO₂ per km
  },
  home: {
    electricity: 0.5, // kg CO₂ per kWh
    natural_gas: 0.2, // kg CO₂ per kWh
  },
  food: {
    red_meat: 10, // kg CO₂ per serving
    vegetarian: 2, // kg CO₂ per serving
    vegan: 1, // kg CO₂ per serving
  },
};