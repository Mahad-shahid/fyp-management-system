from keybert import KeyBERT
from sqlalchemy.orm import Session
from models import User
from typing import List
from sentence_transformers import SentenceTransformer, util

# Load KeyBERT model once at module level
kw_model = KeyBERT()
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def extract_keywords(text: str, top_n: int = 20) -> List[str]:
    """
    Extract the most important technical keywords from a proposal abstract.
    Returns a list of keyword strings.
    """
    keywords = kw_model.extract_keywords(
        text,
        keyphrase_ngram_range=(1, 2),  # single words and two-word phrases
        stop_words='english',
        top_n=top_n
    )
    # keywords is a list of (keyword, score) tuples — extract just the strings
    return [kw[0].lower() for kw in keywords]


def calculate_match_score(
    abstract: str,
    advisor_interests: str
) -> float:
    """
    Calculate semantic similarity between the proposal abstract
    and advisor research interests using sentence embeddings.
    """

    if not advisor_interests:
        return 0.0

    abstract_embedding = embedding_model.encode(
    abstract,
    convert_to_tensor=True
    )

    advisor_embedding = embedding_model.encode(
    advisor_interests,
    convert_to_tensor=True
    )

    similarity = util.cos_sim(
        abstract_embedding,
        advisor_embedding
    ).item()

    similarity = max(0, similarity)

    return round(similarity * 100, 1)


def suggest_advisors(abstract: str, db: Session) -> List[dict]:
    """
    Given a proposal abstract, return a ranked list of advisors
    with their compatibility scores.
    """
    # Step 1: Extract keywords from the proposal
    keywords = extract_keywords(abstract)

    # Step 2: Get all active advisors
    advisors = db.query(User).filter(
        User.role == "advisor",
        User.is_active == True
    ).all()

    if not advisors:
        return []

    # Step 3: Score each advisor
    results = []
    for advisor in advisors:
        score = calculate_match_score(
    abstract,
    advisor.research_interests or ""
)
        results.append({
            "advisor_id": advisor.id,
            "full_name": advisor.full_name,
            "research_interests": advisor.research_interests,
            "compatibility_score": score,
            "matched_keywords": [
                kw for kw in keywords
                if advisor.research_interests
                and kw in advisor.research_interests.lower()
            ]
        })

    # Step 4: Sort by score descending
    results.sort(key=lambda x: x["compatibility_score"], reverse=True)

    return results