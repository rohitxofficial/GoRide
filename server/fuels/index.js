const axios = require("axios");
 
module.exports = {
  async getPrice() {
    const options = {
      method: "GET",
      url: "https://daily-fuel-prices-update-india.p.rapidapi.com/car/v2/fuel/prices",
      params: {
        cityId: "10084"
      },
      headers: {
        src: "android-app",
        appVersion: "1.0",
        deviceId: "abcd",
        "X-RapidAPI-Host": "daily-fuel-prices-update-india.p.rapidapi.com",
        "X-RapidAPI-Key": "{RAPIDAPI_KEY}",
      },
    };
 
    const res = await axios
      .request(options)
      return res.data.data;
  }
}