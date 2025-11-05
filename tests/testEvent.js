const Event = require('../src/models/Event');

const myEvent = new Event(
  1,
  "Philly Food Fest",
  "A fun food festival in the city",
  "City Hall, Philadelphia",
  "2025-11-15T12:00:00",
  "midhusi"
);

myEvent.addAttendee("Alice");
myEvent.addAttendee("Bob");

console.log(myEvent.attendees);          // ["Alice", "Bob"]
console.log(myEvent.isOwner("midhusi")); // true
console.log(myEvent.summary());          // Philly Food Fest at City Hall, Philadelphia on 2025-11-15T12:00:00