'use strict';

// Added the delete option, succes added and delete message

class Workout {
    // Create the date when the new obj was created
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // Running on Month Day
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}


///////////////////////////////////////
// APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

const succesBox = document.querySelector('#succes');
const deleteBox = document.querySelector('#delete');
const closeButton = document.querySelectorAll('#close');

class App {
    layer;
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #keysMyStorage;       
    #markers = new Array();
    #curentMarker;
    #index = 0;
    
  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._closeWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    for (const key of this.#keysMyStorage) {
        this._renderWorkoutMarker(JSON.parse(localStorage.getItem(key)));
        }
    
        
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
      '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      // Check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }


    // Render workout on list
    this._renderWorkout(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);


    // Hide form + clear input fields
    this._hideForm();

    // Show succes message
    this._showSucces();

    // Set local storage to all workouts
    this._setLocalStorage(workout.id, workout);
  }

  _renderWorkoutMarker(workout) {
    this.#curentMarker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
      // Push maker in the marker's array every time we render
      this.#markers.push(this.#curentMarker);

      document.querySelector(`.H${workout.id}`).dataset.marker = this.#index;
      this.#index++;

  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}"  data-id="${workout.id}" data-coords="${workout.coords}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      `;
          html += `
            <i class="fas fa-times-circle H${workout.id}" id="close"  data-key="${workout.id}"></i>
          </li>`
    form.insertAdjacentHTML('afterend', html);
}

    _closeWorkout(e){
        // If the clicked is not the button return
        if(!e.target.classList.contains('fa-times-circle')) return
        // Get the dataset key and the markerIndex
        
        let keyButton = e.target.dataset.key;
        let markerIndex = e.target.dataset.marker;

        // Remove from localStorage the object
        localStorage.removeItem(keyButton);
        // Remove from workout the child
        containerWorkouts.removeChild(e.target.closest('.workout'));
        
        // Remove from the array the selected marker
        this.#map.removeLayer(this.#markers[markerIndex]);
        // this.#map.removeLayer(this.#curentLayer);
        // map.clearLayers();
        this._showDelete();
    }


  _moveToPopup(e) {
    // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
    if (!this.#map) return;

    // Return if clicked is the close button
    if(e.target.classList.contains('fa-times-circle')) return

    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    let coords = workoutEl.dataset.coords.split(',');

    this.#map.flyTo(coords, this.#mapZoomLevel);
  }

  _setLocalStorage(id, workout) {
    localStorage.setItem(id, JSON.stringify(workout));
  }

  _getLocalStorage() {
    this.#keysMyStorage = Object.keys(localStorage).sort();

    for (const key of this.#keysMyStorage) {
      console.log(key);
       this._renderWorkout(JSON.parse(localStorage.getItem(key)));
    }
  }

  _hideSucces(){
    succesBox.classList.toggle('succes--hidden');
    setTimeout(() => (succesBox.classList.toggle('succes--hidden--2')), 1000)
  }

  _showSucces(){
      succesBox.classList.toggle('succes--hidden--2');
      succesBox.classList.toggle('succes--hidden');
      setTimeout(this._hideSucces, 3000)
  }

  _hideDelete(){
    deleteBox.classList.toggle('succes--hidden');
    setTimeout(() => (deleteBox.classList.toggle('succes--hidden--2')), 1000)
  }

  _showDelete(){
      deleteBox.classList.toggle('succes--hidden--2');
      deleteBox.classList.toggle('succes--hidden');
      setTimeout(this._hideDelete, 3000)
  }

}

const app = new App();




