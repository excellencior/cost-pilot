# Android Native Authentication Q&A

This document contains answers to common questions regarding the setup and configuration of the Native Android Authentication flow using Capacitor and Supabase.

---

### **Q: Do I need to update my Supabase dashboard settings with the Android Client ID or SHA-1 fingerprint?**

**A:** No, you do not need to update anything in Supabase for the Android flow!

This throws a lot of people off because you might think you need to add the Android Client ID or SHA-1 fingerprint to the Supabase dashboard somewhere, but you don't. Supabase only ever needs to know about your **Web Client ID**.

Because we configured `strings.xml` with that `server_client_id` (the Web Client ID), the Android app makes a request like this:
1. "Hey Google device, I am `com.costpilot.app` with this specific SHA-1 signature. Please let the user pick an account."
2. "Oh, and by the way, I am requesting that you issue the `idToken` *specifically for* this `server_client_id` (your Web Client ID)."

Google verifies the Android app using the *Android Client ID* behind the scenes, and then it hands your app an `idToken` bound to your *Web Client*! 

When you pass that `idToken` to `supabase.auth.signInWithIdToken()`, Supabase checks it against your existing Web Client ID configuration, sees that it's a perfect match, and logs you right in. 

---

### **Q: The Callback URL set in the Supabase Google Auth settings is `localhost:3000`. Wouldn't that be an issue for the Android app auth?**

**A:** Nope, not an issue at all! 

The callback URL (e.g., `localhost:3000`) is only used for the **Web OAuth Flow**, where Supabase redirects the user away to a browser window (`accounts.google.com`), and Google needs to know exactly where to send the user *back* to after they successfully sign in. 

Because we built a **Native Authentication Flow**, the Android app completely skips the web browser redirect process. Instead:
1. The app natively pops up the Google Account selector from the Android OS.
2. The user taps their account.
3. The Android OS hands the Capacitor app an `idToken` directly.
4. The app sends that `idToken` straight to Supabase via a background API call (`signInWithIdToken()`).

Since the user never leaves the app to open a web browser, there is no "redirect" back, meaning the Callback URL setting in Supabase is completely ignored for the native Android app. The web app will continue to use `localhost:3000` just fine!
