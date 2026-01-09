# Work Hours Tracker

A **React frontend application** to track your daily work hours, pauses, and time off, with weekly and monthly summaries. Perfect for individuals who want to monitor if they’re meeting their target 40-hour work week. Fully frontend, with **localStorage persistence** and **CSV export**.

---

## Features

* **Weekly Calendar View**: Displays all weekdays (Monday–Friday) for the current month.
* **Daily Entries**:

    * Work start and end times
    * Multiple pauses per day
    * Optional time off hours
    * Mark full day as vacation
* **Editable**: Update any entry without deleting it.
* **Weekly & Monthly Analytics**:

    * Weekly total hours
    * Days worked
    * Average hours per day
    * Total time off
    * Visual indicators for weekly targets
* **CSV Export**: Download a full monthly report for your records.
* **Local Storage Persistence**: All data is saved in the browser and stays across page reloads.
* **Clean UI**: Minimal, modern design focused on usability.

---

## Screenshots

*(Add screenshots of your app here — weekly calendar, daily entry, analytics, export button, etc.)*

---

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/work-hours-tracker.git
cd work-hours-tracker
```

2. **Install dependencies**

```bash
npm install
```

3. **Run the development server**

```bash
npm start
```

The app will be available at `http://localhost:3000`.

---

## Usage

1. Navigate to the current month using the **arrow buttons** or click **Today** to return to the current month.
2. Fill in your **start and end work times** for each weekday.
3. Add **pauses** and **time off hours** as needed.
4. Mark a **full day off** if you are on vacation.
5. The app will calculate:

    * Daily worked hours
    * Weekly totals and progress toward 40h
    * Monthly totals, average hours per day, and time off
6. Click **Download Excel** to export a CSV report of the current month.

---

## Technologies

* **React** (JS)
* **CSS** for styling
* Fully frontend — no backend required
* **LocalStorage** for data persistence

---

## Folder Structure

```
work-hours-tracker/
├─ public/
├─ src/
│  ├─ App.js          # Main React component
│  ├─ App.css         # Styling
│  └─ index.js        # React entry point
├─ package.json
└─ README.md
```

---

## Future Improvements

* Add **drag & drop** for quick adjustments of times
* Show **visual bar chart** of hours per day/week
* Add **holiday and weekend handling** automatically
* Allow **customizable weekly hour targets**

---

## License

MIT License – see [LICENSE](LICENSE) file for details.
