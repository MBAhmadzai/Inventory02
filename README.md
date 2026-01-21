# East Coast Electronics - Product Lifecycle Management System

This is a web application designed to help "East Coast Electronics.lk" manage their product inventory and track the entire lifecycle of each item, from initial stock to sale, repair, and final disposition. The system provides a centralized dashboard for at-a-glance insights and detailed views for managing products in different states.

The application is built with a modern tech stack and is designed to connect to Firebase's real-time database.

## Features

- **Dashboard Overview:** A central hub displaying key statistics, including total products, items available for sale, total sold, and products currently in repair.
- **Real-time Activity Log:** A live feed showing the most recent changes and status updates to products in the inventory.
- **Comprehensive Product Management:**
    - Add new products with detailed information such as IMEI, brand, name, type, color, price, and description.
    - Edit existing product details.
    - Delete products from the inventory.
- **Lifecycle Status Tracking:** Easily update a product's status to reflect its current state in the lifecycle:
    - **Available:** Ready for sale.
    - **Sold:** Successfully sold to a customer.
    - **Sales/Repair Return:** Returned by a customer.
    - **In Repair:** Undergoing diagnostics or repair.
    - **Fixed:** Repaired and ready to be restocked.
    - **Parts Used:** Salvaged for parts and decommissioned.
- **Detailed Data Export:** Export full inventory or filtered lists as CSV files for backup or analysis.
- **Filtered Inventory Views:** Dedicated pages to view products based on their status, including `For Sale`, `Sold`, `Returns`, `In Repair`, `Fixed`, `Parts Used`, and an isolated `Demo` list.
- **"Used" Product Indicator:** Products that are restocked after being returned or repaired are automatically marked with a "Used" badge.
- **Responsive Design:** The user interface is fully responsive and works seamlessly on both desktop and mobile devices.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [Firebase Realtime Database](https://firebase.google.com/docs/database) (Cloud-based)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

## Section 1: Project Setup

### 1. Firebase Setup (CRITICAL)

This project is completely dependent on a Firebase project for its database. You **MUST** have a Firebase project to connect to.

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click **"Add project"** and follow the on-screen instructions.

2.  **Enable Realtime Database:**
    *   From your new project's dashboard, go to **Build > Realtime Database**.
    *   Click **"Create Database"**.
    *   Choose a region (e.g., `us-central1` or one closer to you).
    *   Start in **"locked mode"** for security. You will set up rules later if needed.

3.  **Get Your Firebase Credentials:**
    *   In your Firebase project, click the **Gear icon (⚙️)** next to "Project Overview" and select **Project settings**.
    *   Under the "General" tab, scroll down to the "Your apps" section.
    *   Click the **Web icon (`</>`)** to create a new web application.
    *   Give your app a nickname (e.g., "Product Management App") and click **"Register app"**.
    *   Firebase will display a code snippet with a `firebaseConfig` object. **Copy this entire object.**

4.  **Update the Environment File:**
    *   In the root of your project, create a file named `.env`.
    *   Copy the `firebaseConfig` object you got from Firebase.
    *   Add the values to the `.env` file, like this. **Make sure to prefix each key with `NEXT_PUBLIC_FIREBASE_`**.

    ```
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_DATABASE_URL="YOUR_DATABASE_URL"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    ```

5. **Set up the AI Features (Optional):**
    * To use the AI-powered reporting feature, you need a Gemini API key.
    * Get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    * Add it to your `.env` file:

    ```
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```


### 2. Installation

Once your Firebase configuration is set, clone the repository (if you haven't already) and install the project dependencies.

```bash
# Navigate into the project directory
# e.g., cd your-project-folder-name

# Install dependencies
npm install
```

---

## Section 2: Running the Application

### Option A: Running in Development Mode (for local testing)

Once the dependencies are installed, you can start the development server.

```bash
npm run dev
```

The application will now be running at [http://localhost:3000](http://localhost:3000).

### Option B: Running in Production on a Custom Server

To deploy this application on your own server (e.g., a VPS or dedicated machine), you'll need **Node.js v18 or later**.

#### 1. Build the Application

First, create an optimized production build of the project.

```bash
npm run build
```

This creates a `.next` folder with the compiled application code.

#### 2. Run the Application

To start the server, run:
```bash
npm start
```

By default, the app will run on port 3000.

#### 3. Keep the Application Running (Using PM2)

If you close the terminal, the app will stop. To keep it running 24/7, use a process manager like **PM2**.

First, install PM2 globally:
```bash
npm install pm2 -g
```

Then, start your application with PM2:
```bash
pm2 start npm --name "productflow-app" -- start
```

Your application is now running in the background. You can manage it with commands like `pm2 list`, `pm2 logs`, and `pm2 stop productflow-app`.
