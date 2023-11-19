# virtualHealthRecord

## Overview

The Virtual Health Record System is a secure and user-friendly application designed to manage and maintain personal health records digitally. This system allows users to store and access their medical history, prescriptions, appointments, and other health-related information in a centralized and organized manner.

## Features

- **User Authentication**: Secure user accounts with authentication to ensure data privacy.
- **Medical Profile**: Create and update personal health profiles with essential information.
- **Medical History**: Record and manage medical history, including diagnoses, treatments, and surgeries.
- **Prescription Tracker**: Keep track of medications, dosage, and prescription details.
- **Appointment Scheduler**: Schedule and manage medical appointments with reminders.
- **Emergency Contacts**: Store and manage emergency contact information for quick access.

## Installation

1. Clone the repository:

   ```bash
   git clone 'link of the repo'

2 . Instal the dependencies
    ```bash
      cd virtual-health-record  
      npm install
3.Configure the application by updating the configuration files with your database connection details and secret key.

  ![app js - virtualHealthRecord - Visual Studio Code 11_19_2023 3_14_45 PM](https://github.com/pro-Grammerrrr/virtualHealthRecord/assets/113549699/a26ff6b8-d311-48e9-8e3f-45e56351e30c)

  this two line in the code where i have connected the mongo serve you have to use your own local host server and install mongo db to use the server's lines --{
                
                mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
                app.use(session({ secret: process.env.SECRET_KEY, resave: true, saveUninitialized: true }));
              
   changes in the line and then,

4 start the webApp
              start the app using entering this comman in your bash :-  
              
              node app.js
       

5. After doing this the app should be started on local host 3000.
6. USAGE :-
    make an acount for both and remember the passwords

        1.Navigate to the application in your web browser.
       2.Sign up for a new account or log in with existing credentials.
       3.Explore the different sections to manage your health records, prescriptions, appointments.

you should see this after enetering the application :-
![Virtual Health Record - Google Chrome 11_19_2023 4_11_03 PM](https://github.com/pro-Grammerrrr/virtualHealthRecord/assets/113549699/3e25c206-b814-4d2e-8374-c06d4058ec30)


