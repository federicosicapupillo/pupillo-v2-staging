from fastapi import FastAPI

app = FastAPI(title="Pupillo API", version="0.1.0")

@app.get("/")
def read_root():
    return {"message": "Benvenuto nelle API di Pupillo MVP"}

@app.get("/health")
def healthcheck():
    return {"status": "ok"}
