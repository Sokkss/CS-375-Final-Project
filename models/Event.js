class Event {
  constructor(id, title, description, location, time, owner, image = null, externalLink = null) {
    this.id = id;             
    this.title = title;              
    this.description = description;  
    this.location = location;        
    this.time = time;                 
    this.owner = owner;              
    this.attendees = [];              
    this.image = image;               
    this.externalLink = externalLink; 
  }

  // Add a user to the attendees list
  addAttendee(user) {
    if (!this.attendees.includes(user)) {
      this.attendees.push(user);
    }
  }

  // Remove a user from the attendees list
  removeAttendee(user) {
    this.attendees = this.attendees.filter(u => u !== user);
  }

  // Check if a user is the owner of the event
  isOwner(user) {
    return this.owner === user;
  }

  // Return a simple summary of the event
  summary() {
    return `${this.title} at ${this.location} on ${this.time}`;
  }
}

module.exports = Event;
