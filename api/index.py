from flask import Flask, request, jsonify
import json
import os
import subprocess

app = Flask(__name__)

@app.route("/api/bot", methods=["POST"])
def manage_bot():
    try:
        data = request.json
        guest_id = data.get("id")
        guest_pass = data.get("pass")

        # 1. Write/Update amine_token.txt
        token_data = {guest_id: guest_pass}
        with open("amine_token.txt", "w") as f:
            json.dump(token_data, f)

        # 2. Trigger the Bot Main File in my-bot folder
        # Note: In Serverless, long running processes are limited.
        # This will trigger the script and return a confirmation.
        bot_path = os.path.join(os.getcwd(), "my-bot", "main.py")
        
        # Start the process in the background
        subprocess.Popen(["python3", bot_path])

        return jsonify({
            "status": "success",
            "message": f"Token updated. Script {bot_path} has been triggered."
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5321)