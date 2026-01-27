import requests

BASE_URL = "http://127.0.0.1:8000"


def test_health_check():
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health check: {response.json()}")
    assert response.status_code == 200


def test_create_user():
    user_data = {"telegram_id": "123456789"}
    response = requests.post(f"{BASE_URL}/users/", json=user_data)
    print(f"Create user: {response.json()}")
    return response.json()


def test_get_user(telegram_id):
    response = requests.get(f"{BASE_URL}/users/{telegram_id}")
    print(f"Get user: {response.json()}")
    assert response.status_code == 200


def test_get_programs():
    response = requests.get(f"{BASE_URL}/programs/")
    print(f"Get programs: {response.json()}")
    return response.json()


def test_get_program_workouts(program_id):
    response = requests.get(f"{BASE_URL}/programs/{program_id}/workouts")
    print(f"Get program workouts: {response.json()}")
    return response.json()


def test_get_workout_exercises(workout_id):
    response = requests.get(f"{BASE_URL}/workouts/{workout_id}/exercises")
    print(f"Get workout exercises: {response.json()}")
    return response.json()


def test_create_progress(user_id, program_id, workout_id):
    progress_data = {
        "user_id": user_id,
        "program_id": program_id,
        "workout_id": workout_id,
        "is_completed": False
    }
    response = requests.post(f"{BASE_URL}/progress/", json=progress_data)
    print(f"Create progress: {response.json()}")
    return response.json()


def test_complete_workout(progress_id):
    response = requests.patch(f"{BASE_URL}/progress/{progress_id}/complete")
    print(f"Complete workout: {response.json()}")
    return response.json()


def test_get_user_progress(user_id):
    response = requests.get(f"{BASE_URL}/users/{user_id}/progress")
    print(f"Get user progress: {response.json()}")


if __name__ == "__main__":
    print("Starting API tests...\n")

    print("1. Testing health check")
    test_health_check()
    print()

    print("2. Testing user creation")
    user = test_create_user()
    print()

    print("3. Testing get user")
    test_get_user(user["telegram_id"])
    print()

    print("4. Testing get programs")
    programs = test_get_programs()
    print()

    if programs:
        program_id = programs[0]["id"]

        print("5. Testing get program workouts")
        workouts = test_get_program_workouts(program_id)
        print()

        if workouts:
            workout_id = workouts[0]["id"]

            print("6. Testing get workout exercises")
            exercises = test_get_workout_exercises(workout_id)
            print()

            print("7. Testing create progress")
            progress = test_create_progress(user["id"], program_id, workout_id)
            print()

            print("8. Testing complete workout")
            test_complete_workout(progress["id"])
            print()

            print("9. Testing get user progress")
            test_get_user_progress(user["id"])
            print()

    print("All tests completed!")
