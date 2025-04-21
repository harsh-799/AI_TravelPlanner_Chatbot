from flask import Flask, request, jsonify, render_template
from datetime import datetime
from flask_cors import CORS
import os
from dotenv import load_dotenv
import googlemaps
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import initialize_agent, Tool

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MAPS_API_KEY = os.getenv("MAPS_API_KEY")

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=GEMINI_API_KEY)

app = Flask(__name__)
CORS(app)

gmaps = googlemaps.Client(key=MAPS_API_KEY)

def create_travel_plan(query):
    days = query.get("days")
    source = query.get("source_name")
    destination = query.get("destination_name")
    budget = query.get("budget")  

    if not all([days, source, destination]):
        return "Missing required travel information."

    if budget:
        prompt = f"Create a travel itinerary from {source} to {destination} for {days} days within a budget of ₹{budget}. Include transportation, accommodation, food, and activities."
    else:
        prompt = f"Create a travel itinerary from {source} to {destination} for {days} days. Give it in a simple and clear format."

    plan = llm.predict(prompt)

    maps_link = f"https://www.google.com/maps/dir/{source.replace(' ', '+')}/{destination.replace(' ', '+')}"

    plan_with_map = f"{plan}\n\n🔗 [View route on Google Maps]({maps_link})"

    return plan_with_map

    maps_link = f"https://www.google.com/maps/dir/{source.replace(' ', '+')}/{destination.replace(' ', '+')}"

    plan_with_map = f"{plan}\n\n🔗 [View route on Google Maps]({maps_link})"

    return plan_with_map

tools = [
    Tool(
        name="Travel Planner",
        func=create_travel_plan,
        description="Use this tool for planning travel between two locations for a given number of days."
    )
]

agent = initialize_agent(tools, llm, agent="chat-zero-shot-react-description", verbose=True)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    query = data.get('query')
    days = data.get('days')
    source = data.get('source_name')
    destination = data.get('destination_name')
    budget = data.get("budget")

    if not all([query, days, source, destination]):
        return jsonify({"error": "Missing one or more required fields."}), 400

    result = create_travel_plan({
    "days": days,
    "source_name": source,
    "destination_name": destination,
    "budget": budget

})
    return jsonify({"response": result})

@app.route('/geocode', methods=['POST'])
def geocode():
    data = request.get_json()
    location = data.get('location')

    if not location:
        return jsonify({"error": "Location field is required."}), 400

    geocode_result = gmaps.geocode(location)
    if geocode_result:
        latlng = geocode_result[0]['geometry']['location']
        return jsonify(latlng)
    return jsonify({"error": "No geocoding result found."}), 404

@app.route('/directions', methods=['POST'])
def directions():
    data = request.get_json()
    source = data.get('source')
    destination = data.get('destination')

    if not source or not destination:
        return jsonify({"error": "Both source and destination are required."}), 400

    directions_result = gmaps.directions(source, destination, mode="driving")
    if directions_result:
        return jsonify(directions_result[0])
    return jsonify({"error": "No directions found."}), 404

@app.route('/nearby', methods=['POST'])
def nearby():
    data = request.get_json()
    location = data.get('location')
    radius = data.get('radius', 5000)
    place_type = data.get('place_type', 'restaurant')

    if not location:
        return jsonify({"error": "Location is required."}), 400

    places_result = gmaps.places_nearby(location=location, radius=radius, type=place_type)
    return jsonify(places_result)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login_signup')
def login_signup():
    return render_template('login_signup.html')

@app.route('/chatbot')
def chatbot():
    # Get current hour
    hour = datetime.now().hour
    if 5 <= hour < 12:
        greeting = "Good morning"
    elif 12 <= hour < 18:
        greeting = "Good afternoon"
    else:
        greeting = "Good evening"

    # Final greeting message
    welcome_message = f"Hi, {greeting}! I'm your Travelly assistant 🤖, here to make your trip planning smooth and fun. Type /start to begin."

    return render_template('trippy.html', greeting=welcome_message)

if __name__ == '__main__':
    app.run(debug=True)
