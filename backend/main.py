from fastapi import FastAPI

app = FastAPI(title="FYPMS API", version="1.0")

@app.get("/")
def root():
    return {"message": "FYPMS API is running"}