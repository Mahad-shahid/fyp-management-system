from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from sqlalchemy.orm import Session
from models import ProjectArchive

# Load model once at module level — not on every request
# This model produces 384-dimensional vectors
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text: str) -> np.ndarray:
    """Convert any text string into a 384-dim vector."""
    return model.encode([text])[0]

def check_duplicate(abstract: str, db: Session) -> dict:
    """
    Compare a new proposal abstract against all archived projects.
    Returns the highest similarity score and the most similar project title.
    """
    # Step 1: Encode the incoming abstract
    new_vector = get_embedding(abstract)

    # Step 2: Fetch all archived projects
    archive = db.query(ProjectArchive).all()

    if not archive:
        return {
            "similarity_score": 0.0,
            "similar_to_project": None,
            "is_duplicate": False
        }

    # Step 3: Encode all archive abstracts
    # (In Phase 5 these will be pre-stored as vectors — for now we compute live)
    archive_texts = [p.abstract for p in archive]
    archive_vectors = model.encode(archive_texts)

    # Step 4: Compute cosine similarity between new vector and all archive vectors
    similarities = cosine_similarity([new_vector], archive_vectors)[0]

    # Step 5: Find the highest match
    max_index = int(np.argmax(similarities))
    max_score = float(similarities[max_index])
    most_similar_title = archive[max_index].title

    return {
        "similarity_score": round(max_score, 4),
        "similar_to_project": most_similar_title,
        "is_duplicate": max_score > 0.80
    }


def seed_embeddings(db: Session):
    """
    Pre-compute and store embeddings for all archive projects.
    Call this once from a setup script — not on every request.
    Note: embedding column requires pgvector. Will be enabled in Phase 5.
    For now this function is a placeholder.
    """
    archive = db.query(ProjectArchive).all()
    print(f"Found {len(archive)} archived projects.")
    for project in archive:
        embedding = get_embedding(project.abstract)
        print(f"  Embedded: {project.title[:50]} → vector shape {embedding.shape}")
    print("Embedding preview complete. pgvector storage enabled in Phase 5.")