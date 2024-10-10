'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Plane, AlertTriangle, Search, RefreshCw } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

interface Flight {
  flight_icao: string
  flight_iata: string
  dep_iata: string
  arr_iata: string
  airline_icao: string
  airline_iata: string
  latitude: number
  longitude: number
  altitude: number
  speed: number
  status: string
  direction: number
}

interface Airport {
  airport_name: string
  iata_code: string
  icao_code: string
  latitude: string
  longitude: string
  country_name: string
  city_iata_code: string
}

const createPlaneIcon = (direction: number) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6" style="transform: rotate(${direction}deg);">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: 'plane-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

const airportIcon = L.icon({
  iconUrl: 'https://cdn0.iconfinder.com/data/icons/travel-line-color-hipster-in-outlines/512/Airport-512.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const generateMockFlights = (count: number): Flight[] => {
  const airlines = ['AA', 'UA', 'DL', 'LH', 'BA', 'AF', 'KL', 'EK', 'QR', 'SQ']
  const statuses = ['scheduled', 'active', 'landed', 'delayed', 'cancelled']
  const flights: Flight[] = []

  for (let i = 0; i < count; i++) {
    const airline = airlines[Math.floor(Math.random() * airlines.length)]
    flights.push({
      flight_icao: `${airline}${Math.floor(1000 + Math.random() * 9000)}`,
      flight_iata: `${airline}${Math.floor(100 + Math.random() * 900)}`,
      dep_iata: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      arr_iata: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      airline_icao: `${airline}A`,
      airline_iata: airline,
      latitude: Math.random() * 180 - 90,
      longitude: Math.random() * 360 - 180,
      altitude: Math.floor(Math.random() * 40000) + 5000,
      speed: Math.floor(Math.random() * 500) + 300,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      direction: Math.floor(Math.random() * 360),
    })
  }

  return flights
}

const generateMockAirports = (count: number): Airport[] => {
  const airports: Airport[] = []
  const countries = ['USA', 'UK', 'Germany', 'France', 'Japan', 'Australia', 'Canada', 'Brazil', 'India', 'China']

  for (let i = 0; i < count; i++) {
    const iataCode = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
    airports.push({
      airport_name: `${iataCode} International Airport`,
      iata_code: iataCode,
      icao_code: `K${iataCode}`,
      latitude: (Math.random() * 180 - 90).toFixed(6),
      longitude: (Math.random() * 360 - 180).toFixed(6),
      country_name: countries[Math.floor(Math.random() * countries.length)],
      city_iata_code: iataCode.slice(0, 2),
    })
  }

  return airports
}

export default function FlightTracker() {
  const [flights, setFlights] = useState<Flight[]>([])
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([])
  const [airports, setAirports] = useState<Airport[]>([])
  const [filteredAirports, setFilteredAirports] = useState<Airport[]>([])
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState<'flight' | 'airport'>('flight')
  const [loading, setLoading] = useState(true)

  const fetchMockData = () => {
    setLoading(true)
    try {
      const mockFlights = generateMockFlights(100)
      const mockAirports = generateMockAirports(50)
      setFlights(mockFlights)
      setFilteredFlights(mockFlights)
      setAirports(mockAirports)
      setFilteredAirports([])
      setError(null)
    } catch (error) {
      console.error('Error generating mock data:', error)
      setError('Failed to generate mock data. Please try again.')
      setFlights([])
      setFilteredFlights([])
      setAirports([])
      setFilteredAirports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMockData()
    const interval = setInterval(() => {
      setFlights(prevFlights => prevFlights.map(flight => ({
        ...flight,
        latitude: flight.latitude + (Math.random() - 0.5) * 0.1,
        longitude: flight.longitude + (Math.random() - 0.5) * 0.1,
        altitude: Math.max(5000, Math.min(40000, flight.altitude + (Math.random() - 0.5) * 1000)),
        speed: Math.max(300, Math.min(800, flight.speed + (Math.random() - 0.5) * 50)),
        direction: (flight.direction + (Math.random() - 0.5) * 10 + 360) % 360,
      })))
    }, 5000) // Update flight positions every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const handleSearch = () => {
    if (searchTerm.trim() === '') {
      setFilteredFlights(flights)
      setFilteredAirports([])
      return
    }

    const searchTermLower = searchTerm.toLowerCase()
    if (searchType === 'flight') {
      const filtered = flights.filter(flight => 
        flight.flight_icao.toLowerCase().includes(searchTermLower) ||
        flight.flight_iata.toLowerCase().includes(searchTermLower)
      )
      setFilteredFlights(filtered)
      setFilteredAirports([])
    } else {
      const filtered = airports.filter(airport => 
        airport.airport_name.toLowerCase().includes(searchTermLower) ||
        airport.iata_code.toLowerCase().includes(searchTermLower) ||
        airport.icao_code.toLowerCase().includes(searchTermLower)
      )
      setFilteredAirports(filtered)
      setFilteredFlights([])
    }
  }

  useEffect(() => {
    handleSearch()
  }, [searchTerm, searchType, flights, airports])

  const animatePlanes = useMemo(() => {
    return filteredFlights.map(flight => ({
      ...flight,
      icon: createPlaneIcon(flight.direction),
    }))
  }, [filteredFlights])

  return (
    <div className="flex h-screen">
      <div className="w-1/3 p-4 bg-gray-100 overflow-y-auto flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Flight Tracker (Mock Data)</h1>
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input
              type="text"
              placeholder={`Search by ${searchType === 'flight' ? 'flight number' : 'airport'}`}
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
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'flight' | 'airport')}
            className="p-2 text-black w-full rounded-md"
          >
            <option value="flight">Search by Flight Number</option>
            <option value="airport">Search by Airport</option>
          </select>
        </div>
        <h2 className="text-xl font-bold mb-4 flex items-center">
          {searchType === 'flight' ? (
            <><Plane className="mr-2 h-5 w-5" /> Flight Information</>
          ) : (
            <><Plane className="mr-2 h-5 w-5" /> Airport Information</>
          )}
        </h2>
        {loading ? (
          <div className="flex items-center justify-center">
            <RefreshCw className="animate-spin h-8 w-8 text-primary" />
            <span className="ml-2">Loading data...</span>
          </div>
        ) : error ? (
          <div className="bg-destructive/20 border-l-4 border-destructive text-destructive-foreground p-4 mb-4 rounded-md" role="alert">
            <p className="font-bold flex items-center"><AlertTriangle className="mr-2 h-5 w-5" /> Error</p>
            <p>{error}</p>
            <button
              onClick={fetchMockData}
              className="mt-2 bg-primary text-primary-foreground p-2 rounded-md flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </button>
          </div>
        ) : searchType === 'flight' ? (
          filteredFlights.length === 0 ? (
            <p>No flights found. Try adjusting your search or refreshing the data.</p>
          ) : selectedFlight ? (
            <div className="bg-card p-4 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">{selectedFlight.flight_iata}</h3>
              <p><strong>Flight ICAO:</strong> {selectedFlight.flight_icao}</p>
              <p><strong>Airline:</strong> {selectedFlight.airline_iata} ({selectedFlight.airline_icao})</p>
              <p><strong>From:</strong> {selectedFlight.dep_iata}</p>
              <p><strong>To:</strong> {selectedFlight.arr_iata}</p>
              <p><strong>Latitude:</strong> {selectedFlight.latitude.toFixed(4)}°</p>
              <p><strong>Longitude:</strong> {selectedFlight.longitude.toFixed(4)}°</p>
              <p><strong>Altitude:</strong> {selectedFlight.altitude} ft</p>
              <p><strong>Speed:</strong> {selectedFlight.speed} kph</p>
              <p><strong>Direction:</strong> {selectedFlight.direction.toFixed(2)}°</p>
              <p><strong>Status:</strong> {selectedFlight.status}</p>
            </div>
          ) : (
            <p>Click on a plane to view its details</p>
          )
        ) : (
          filteredAirports.length === 0 ? (
            <p>No airports found. Try adjusting your search or refreshing the data.</p>
          ) : selectedAirport ? (
            <div className="bg-card p-4 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">{selectedAirport.airport_name}</h3>
              <p><strong>IATA Code:</strong> {selectedAirport.iata_code}</p>
              <p><strong>ICAO Code:</strong> {selectedAirport.icao_code}</p>
              <p><strong>Latitude:</strong> {selectedAirport.latitude}°</p>
              <p><strong>Longitude:</strong> {selectedAirport.longitude}°</p>
              <p><strong>Country:</strong> {selectedAirport.country_name}</p>
              <p><strong>City IATA Code:</strong> {selectedAirport.city_iata_code}</p>
            </div>
          ) : (
            <p>Click on an airport to view its details</p>
          )
        )}
      </div>
      <div className="flex-1">
        <MapContainer center={[0, 0]} zoom={3} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {searchType === 'flight' ? (
            animatePlanes.map((flight) => (
              <Marker
                key={flight.flight_icao}
                position={[flight.latitude, flight.longitude]}
                icon={flight.icon}
                eventHandlers={{
                  click: () =>   setSelectedFlight(flight),
                }}
              >
                <Popup>
                  <div>
                    <h3 className="font-bold">{flight.flight_iata}</h3>
                    <p>From: {flight.dep_iata}</p>
                    <p>To: {flight.arr_iata}</p>
                    <p>Status: {flight.status}</p>
                  </div>
                </Popup>
              </Marker>
            ))
          ) : (
            filteredAirports.map((airport) => (
              <Marker
                key={airport.iata_code}
                position={[parseFloat(airport.latitude), parseFloat(airport.longitude)]}
                icon={airportIcon}
                eventHandlers={{
                  click: () => setSelectedAirport(airport),
                }}
              >
                <Popup>
                  <div>
                    <h3 className="font-bold">{airport.airport_name}</h3>
                    <p>IATA: {airport.iata_code}</p>
                    <p>ICAO: {airport.icao_code}</p>
                    <p>Country: {airport.country_name}</p>
                  </div>
                </Popup>
              </Marker>
            ))
          )}
        </MapContainer>
      </div>
    </div>
  )
}