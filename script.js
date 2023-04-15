'use strict';
// SELECTING -------------------------------------------------
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
// Workout Class ---------------------------------------------
class Workout {
  id = (Date.now() + '').slice(-10);
  date = new Date();
  click = 0;
  constructor(distance, duration, coord) {
    this.distance = distance;
    this.duration = duration;
    this.coord = coord; // [latitue, longitute]
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${
      this.workoutType[0].toUpperCase() + this.workoutType.slice(1)
    } on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
  _click() {
    this.click++;
  }
}

// Running Class --------------------------------------------
class Running extends Workout {
  workoutType = 'running';
  constructor(distance, duration, coord, cadence) {
    super(distance, duration, coord);
    this.cadence = cadence;
    this.calculatePace();
    this._setDescription();
  }

  calculatePace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
// Cycling Class --------------------------------------------
class Cycling extends Workout {
  workoutType = 'cycling';
  constructor(distance, duration, coord, elevationGain) {
    super(distance, duration, coord);
    this.elevationGain = elevationGain;
    this.calculateSpeed();
    this._setDescription();
  }

  calculateSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// App Class -------------------------------------------------
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this)); // IMPORTANT submit event
    inputType.addEventListener('change', this._toggleElevationField); // IMPORTANT change event
    containerWorkouts.addEventListener('click', this._moveToPupop.bind(this));
  }
  _getPosition() {
    // IMPORTANT
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Cannot get your current position!');
      }
    );
  }
  _loadMap(postition) {
    const { latitude } = postition.coords;
    const { longitude } = postition.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    // render the marker from local storage
    this.#workouts.forEach(workout => {
      this._renderWorkoutMarker(workout);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus(); // IMPORTANT
  }
  _hidenForm() {
    // Clear input field
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    // IMPORTANT hiden the form
    form.style.display = 'none'; // avoid triggering the animation
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000); // get the display back
  }
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    e.preventDefault();
    // Check input is number or not
    const isValidNumber = function (...inputs) {
      return inputs.every(input => Number.isFinite(input));
    };
    // Check input is positive or not
    const isPositiveNumber = (...inputs) => inputs.every(input => input > 0);
    // Get data from form
    const workoutType = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
    const { lat, lng } = this.#mapEvent.latlng;

    // If workout is running => create running object
    if (workoutType === 'running') {
      const cadence = +inputCadence.value;
      // Check whether data is valid
      if (
        !isValidNumber(distance, duration, cadence) ||
        !isPositiveNumber(distance, duration, cadence)
      )
        return alert('The input must be a positive number!');
      workout = new Running(distance, duration, [lat, lng], cadence);
    }

    // If workout is cycling => create cycling object
    if (workoutType === 'cycling') {
      const elevationGain = +inputElevation.value;
      // Check whether data is valid
      if (
        !isValidNumber(distance, duration, elevationGain) ||
        !isPositiveNumber(distance, duration)
      )
        return alert('The input must be a positive number!');
      workout = new Cycling(distance, duration, [lat, lng], elevationGain);
    }

    // Add new object to workout array
    this.#workouts.push(workout);
    console.log(this.#workouts);
    // Render workout as a marker
    this._renderWorkoutMarker(workout);
    // Render workout on list
    this._renderWorkoutOnList(workout);

    // hiden form and clear input fields
    this._hidenForm();
    // set local storage
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coord)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.workoutType}-popup`,
        })
      )
      .setPopupContent(
        `${workout.workoutType === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
          workout.description
        }`
      )
      .openPopup();
  }
  _renderWorkoutOnList(workout) {
    let html = `
     <li class="workout workout--${workout.workoutType}" data-id="${
      workout.id
    }">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
       <span class="workout__icon">${
         workout.workoutType === 'running' ? '🏃‍♂️' : '🚴‍♀️'
       }</span>
       <span class="workout__value">${workout.distance}</span>
       <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
       <span class="workout__icon">⏱</span>
       <span class="workout__value">${workout.duration}</span>
       <span class="workout__unit">min</span>
      </div>`;
    if (workout.workoutType === 'running') {
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
    </li>
        `;
    }
    if (workout.workoutType === 'cycling') {
      html += `
      <div class="workout__details">
       <span class="workout__icon">⚡️</span>
       <span class="workout__value">${workout.speed.toFixed(1)}</span>
       <span class="workout__unit">min/km</span>
     </div>
     <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">spm</span>
    </div>
 </li>
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPupop(e) {
    const workoutElm = e.target.closest('.workout');
    if (!workoutElm) return; // avoid null or exepcion
    const workout = this.#workouts.find(
      workout => workout.id === workoutElm.dataset.id
    );
    this.#map.setView(workout.coord, this.#mapZoomLevel, {
      animate: true,
    });
  }
  _setLocalStorage() {
    // IMPORTANT
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    // IMPORTANT
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(workout => {
      this._renderWorkoutOnList(workout);
    });
  }
  _reset() {
    localStorage.removeItem('workouts'); // IMPORTANT
    location.reload(); // IMPORTANT
  }
}
//------------------------------------------------------------

const app = new App();
