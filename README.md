# obsidian-time-logger

A modern, high-performance productivity dashboard designed for granular activity tracking and long-term goal management. This application provides a streamlined interface for logging daily tasks, maintaining persistent notebooks, and archiving progress for historical review.

[**🔗 View Live Demo on DigitalOcean**](https://obsidian-logger-djozf.ondigitalocean.app/)

---
## 📸 Application Preview

<p align="center">
  <img src="image_2026-02-07_15-24-12.png" alt="Obsidian Logger Preview 1" width="800">
  <br>
  <img src="image_2026-02-07_15-27-46.png" alt="Obsidian Logger Preview 2" width="800">
</p>


## 🌟 Key Features

* **Dynamic Timeline Tracking:** Effortlessly log daily activities with a user-friendly interface to visualize your "History Flow" throughout the day.
* **Integrated Note-Taking System:**
    * **Quick Note (Short-term):** Optimized for ephemeral daily thoughts and immediate "to-do" items.
    * **NoteBook (Long-term):** Dedicated space for permanent goals and long-form project planning.
* **Automated Archiving:** Supports both manual and automated log archiving, allowing users to clear their daily workspace while retaining a searchable history of past productivity.
* **Secure Cloud Storage:** Fully integrated with a backend database to ensure all user data is safely stored and persistent across sessions.
* **Robust UX/UI:** Includes comprehensive error handling for authentication (Login/Register) and real-time validation to ensure a seamless user experience.

## 🛠️ Technical Stack

* **Backend:** Python, Flask
* **Frontend:** React (Component-based architecture), HTML5, CSS3, JavaScript (ES6+)
* **Database:** SQLAlchemy, SQLite (Online Persistence)
* **Infrastructure:** Deployed via DigitalOcean

## 💻 Local Development

To run this project locally, ensure you have Python installed, then follow these steps:

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/j494zhu/Obsidian-Time-Logger.git
    cd obsidian-time-logger
    ```

2.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Launch the Application**
    ```bash
    python app.py
    ```
    *The server will initialize at `http://127.0.0.1:5000/`*

---
*Developed by Juncheng Zhu — University of Waterloo Computer Science*