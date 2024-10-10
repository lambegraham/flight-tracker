"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Plane, AlertTriangle, Search, RefreshCw } from "lucide-react";
import axios from "axios";
import "leaflet/dist/leaflet.css";

interface Flight {
  icao24: string;
  callsign: string;
  origin_country: string;
  time_position: number;
  last_contact: number;
  longitude: number;
  latitude: number;
  baro_altitude: number;
  on_ground: boolean;
  velocity: number;
  true_track: number;
  vertical_rate: number;
  sensors: number[] | null;
  geo_altitude: number;
  squawk: string | null;
  spi: boolean;
  position_source: number;
}

const createPlaneIcon = (direction: number) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6" style="transform: rotate(${direction}deg);">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: "plane-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const generateMockFlights = (count: number): Flight[] => {
  const flights: Flight[] = [];
  const countries = [
    "USA",
    "UK",
    "France",
    "Germany",
    "Japan",
    "Canada",
    "Australia",
    "Brazil",
    "China",
    "India",
  ];
  const airlines = [
    "AAL",
    "BAW",
    "DLH",
    "AFR",
    "UAL",
    "SIA",
    "QFA",
    "JAL",
    "ANA",
    "KAL",
  ];

  for (let i = 0; i < count; i++) {
    const icao24 = Math.random().toString(16).substr(2, 6);
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const flightNumber = Math.floor(Math.random() * 9000) + 1000;
    flights.push({
      icao24,
      callsign: `${airline}${flightNumber}`,
      origin_country: countries[Math.floor(Math.random() * countries.length)],
      time_position: Math.floor(Date.now() / 1000),
      last_contact: Math.floor(Date.now() / 1000),
      longitude: Math.random() * 360 - 180,
      latitude: Math.random() * 180 - 90,
      baro_altitude: Math.random() * 10000 + 1000,
      on_ground: Math.random() > 0.9,
      velocity: Math.random() * 300 + 400,
      true_track: Math.random() * 360,
      vertical_rate: (Math.random() - 0.5) * 20,
      sensors: null,
      geo_altitude: Math.random() * 10000 + 1000,
      squawk: Math.floor(Math.random() * 9000 + 1000).toString(),
      spi: false,
      position_source: Math.floor(Math.random() * 3),
    });
  }
  return flights;
};

export default function FlightTracker() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  const fetchFlights = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "https://opensky-network.org/api/states/all"
      );
      if (response.data && Array.isArray(response.data.states)) {
        const flightData: Flight[] = response.data.states.map((state: any) => ({
          icao24: state[0],
          callsign: state[1]?.trim() || "N/A",
          origin_country: state[2],
          time_position: state[3],
          last_contact: state[4],
          longitude: state[5],
          latitude: state[6],
          baro_altitude: state[7],
          on_ground: state[8],
          velocity: state[9],
          true_track: state[10],
          vertical_rate: state[11],
          sensors: state[12],
          geo_altitude: state[13],
          squawk: state[14],
          spi: state[15],
          position_source: state[16],
        }));
        setFlights(flightData);
        setFilteredFlights(flightData);
        setError(null);
        setUsingMockData(false);
      } else {
        throw new Error("No flight data available");
      }
    } catch (error) {
      console.error("Error fetching flight data:", error);
      const mockFlights = generateMockFlights(100);
      setFlights(mockFlights);
      setFilteredFlights(mockFlights);
      setError("Failed to fetch real flight data. Using mock data instead.");
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
    const interval = setInterval(fetchFlights, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    if (searchTerm.trim() === "") {
      setFilteredFlights(flights);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = flights.filter(
      (flight) =>
        flight.icao24.toLowerCase().includes(searchTermLower) ||
        (flight.callsign &&
          flight.callsign.toLowerCase().includes(searchTermLower))
    );
    setFilteredFlights(filtered);
  };

  useEffect(() => {
    handleSearch();
  }, [searchTerm, flights]);

  const animatePlanes = useMemo(() => {
    return filteredFlights.map((flight) => ({
      ...flight,
      icon: createPlaneIcon(flight.true_track || 0),
    }));
  }, [filteredFlights]);

  return (
    <div className="flex h-screen">
      <div className="w-1/3 p-4 bg-gray-100 overflow-y-auto flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Flight Tracker</h1>
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input
              type="text"
              placeholder="Search by ICAO24 or callsign"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 rounded-l-md text-black w-full"
            />
            <button
              onClick={handleSearch}
              className="bg-primary p-2 rounded-r-md text-primary-foreground"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Plane className="mr-2 h-5 w-5" /> Flight Information
        </h2>
        {loading ? (
          <div className="flex items-center justify-center">
            <RefreshCw className="animate-spin h-8 w-8 text-primary" />
            <span className="ml-2">Loading data...</span>
          </div>
        ) : error ? (
          <div
            className="bg-destructive/20 border-l-4 border-destructive text-destructive-foreground p-4 mb-4 rounded-md"
            role="alert"
          >
            <p className="font-bold flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" /> Notice
            </p>
            <p>{error}</p>
            <button
              onClick={fetchFlights}
              className="mt-2 bg-primary text-primary-foreground p-2 rounded-md flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Retry with real data
            </button>
          </div>
        ) : null}
        {usingMockData && (
          <div
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-md"
            role="alert"
          >
            <p className="font-bold">Using Mock Data</p>
            <p>
              The current flight data is simulated. Real-time data is
              unavailable.
            </p>
          </div>
        )}
        {filteredFlights.length === 0 ? (
          <p>
            No flights found. Try adjusting your search or refreshing the data.
          </p>
        ) : selectedFlight ? (
          <div className="bg-card p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">
              {selectedFlight.callsign || "N/A"}
            </h3>
            <p>
              <strong>ICAO24:</strong> {selectedFlight.icao24}
            </p>
            <p>
              <strong>Origin Country:</strong> {selectedFlight.origin_country}
            </p>
            <p>
              <strong>Latitude:</strong> {selectedFlight.latitude?.toFixed(4)}°
            </p>
            <p>
              <strong>Longitude:</strong> {selectedFlight.longitude?.toFixed(4)}
              °
            </p>
            <p>
              <strong>Altitude:</strong>{" "}
              {selectedFlight.baro_altitude
                ? `${selectedFlight.baro_altitude.toFixed(0)} m`
                : "N/A"}
            </p>
            <p>
              <strong>Velocity:</strong>{" "}
              {selectedFlight.velocity
                ? `${selectedFlight.velocity.toFixed(2)} m/s`
                : "N/A"}
            </p>
            <p>
              <strong>True Track:</strong>{" "}
              {selectedFlight.true_track
                ? `${selectedFlight.true_track.toFixed(2)}°`
                : "N/A"}
            </p>
            <p>
              <strong>On Ground:</strong>{" "}
              {selectedFlight.on_ground ? "Yes" : "No"}
            </p>
          </div>
        ) : (
          <p>Click on a plane to view its details</p>
        )}
      </div>
      <div className="flex-1">
        <MapContainer
          center={[0, 0]}
          zoom={3}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {animatePlanes.map((flight) =>
            flight.latitude && flight.longitude ? (
              <Marker
                key={flight.icao24}
                position={[flight.latitude, flight.longitude]}
                icon={flight.icon}
                eventHandlers={{
                  click: () => setSelectedFlight(flight),
                }}
              >
                <Popup>
                  <div>
                    <h3 className="font-bold">{flight.callsign || "N/A"}</h3>
                    <p>ICAO24: {flight.icao24}</p>
                    <p>Origin: {flight.origin_country}</p>
                    <p>
                      Altitude:{" "}
                      {flight.baro_altitude
                        ? `${flight.baro_altitude.toFixed(0)} m`
                        : "N/A"}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ) : null
          )}
        </MapContainer>
      </div>
    </div>
  );
}
