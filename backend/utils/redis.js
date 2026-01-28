import Redis from "ioredis";

const redis = new Redis(); // default localhost:6379

export default redis;






// const redis = new Redis({
//   host: "3.109.204.28",
//   port: 6379,
// //   password: "mypassword123",
// });

// export default redis;