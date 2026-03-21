//calculate variables for car physics - 
// maybe convert from easily understood variables - like top speed, power, weight, to variables in more suitable format for simulation.

// stats for lister storm race car taken from 
// With 546bhp, 583lb ft of torque, a Motec management system, a weight of 3,668lb and a drag co-efficient of 0.35cd, the Storm had a claimed top speed of almost 208MPH and 0-60mph in just 4.1 seconds

// for now ignore power curve and just consider power. expect acceleration figures . maybe torque figure can be used to estimate power curve later.

// if assume that max power is used at top speed, can get estimate for frontal area. (though don't really need this)

// 208mph ~93 m/s
// 546bhp ~ 407kW

// power = force*speed
// force = power / speed.
// drag force at top speed = 407kW / 93m/s = 4376 N

// mass of car : 3,668lb / 2.2 = 1667kg.
// acceleration due to this force: 4376 / 1667 = 2.62 ms^-2 , ~0.27g

// since drag is proportional to speed squared 
// drag_const * speed^2 = drag_acc

// drag_const * (93m/s)^2 = 2.62 ms^-2

// drag_const = 0.000303 m^-1



//acceleration due to engine. 
// goes as speed^-1
// engine_acc_const / speed = engine_acc
// engine_acc_const / 93m/s = 2.62 ms^-2


// engine_acc_const = 243.66 m^2s^-3


// so acceleration as speed v =

// engine_acc_const*throttle_input / v - drag_const / v^2

// = ( 243.66 m^2s^-3 ) *throttle_input / v -   0.000303 m^-1 * v^2


var carParams = {
    engine_acc_const : 243.66,
    drag_const : 0.000303
};
