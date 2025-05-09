from diffprivlib.mechanisms import Laplace
import numpy as np

def apply_dp_to_average(values: list[float], epsilon: float = 1.0) -> float:
    if not values:
        return 0.0
    mech = Laplace(epsilon=epsilon, sensitivity=1.0)
    true_avg = np.mean(values)
    noisy_avg = mech.randomise(true_avg)
    return noisy_avg
