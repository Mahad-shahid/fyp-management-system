from database import SessionLocal
from models import User, Group, GroupMember, ProjectArchive, Deadline
from datetime import datetime, timedelta
import bcrypt
 
def hash_pw(password):
    return bcrypt.hashpw(password[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
 
db = SessionLocal()
 
# --- Create users ---
admin = User(
    email="admin@iobm.edu.pk",
    password_hash=hash_pw("admin123"),
    full_name="FYP Coordinator",
    role="admin"
)
 
advisor1 = User(
    email="advisor1@iobm.edu.pk",
    password_hash=hash_pw("advisor123"),
    full_name="Dr. Arif Khan",
    role="advisor",
    research_interests="IoT, Embedded Systems, Smart Home, Wireless Networks"
)
 
advisor2 = User(
    email="advisor2@iobm.edu.pk",
    password_hash=hash_pw("advisor123"),
    full_name="Dr. Sara Malik",
    role="advisor",
    research_interests="Machine Learning, Deep Learning, Computer Vision, NLP"
)
 
student1 = User(
    email="mahad@student.iobm.edu.pk",
    password_hash=hash_pw("student123"),
    full_name="Mahad Shahid",
    role="student",
    student_id="20221-32764"
)
 
student2 = User(
    email="irtiza@student.iobm.edu.pk",
    password_hash=hash_pw("student123"),
    full_name="Muhammad Irtiza Zubair",
    role="student",
    student_id="20221-32618"
)
 
db.add_all([admin, advisor1, advisor2, student1, student2])
db.commit()
db.refresh(admin)
db.refresh(advisor1)
db.refresh(student1)
db.refresh(student2)
 
# --- Create a group ---
group1 = Group(group_name="Group Alpha", status="active", advisor_id=advisor1.id)
db.add(group1)
db.commit()
db.refresh(group1)
 
# --- Add members ---
db.add(GroupMember(group_id=group1.id, student_id=student1.id))
db.add(GroupMember(group_id=group1.id, student_id=student2.id))
 
# --- Seed archive with past projects (for AI testing) ---
past_projects = [
    ("Smart Home Automation System", "This project develops an IoT-based system to control home appliances remotely using a mobile app and voice commands.", 2023),
    ("Online Blood Bank Management System", "A web application that connects blood donors with recipients and hospitals in real time.", 2022),
    ("AI-Based Disease Prediction System", "Uses machine learning algorithms to predict diseases based on patient symptoms and medical history.", 2023),
    ("E-Commerce Platform with Recommendation Engine", "A full-stack e-commerce site with a collaborative filtering based product recommendation system.", 2022),
    ("Blockchain-Based Document Verification System", "Uses Ethereum smart contracts to verify the authenticity of academic certificates.", 2021),
    ("Real-Time Face Recognition Attendance System", "Uses OpenCV and deep learning to mark student attendance automatically via webcam.", 2022),
    ("Ride Sharing Application", "A mobile and web application connecting drivers and passengers for carpooling.", 2021),
    ("Student Result Management System", "A portal for managing and publishing student exam results with analytics.", 2020),
]
 
for title, abstract, year in past_projects:
    db.add(ProjectArchive(title=title, abstract=abstract, year=year))
 
# --- Create deadlines ---
db.add(Deadline(
    title="SRS Submission",
    due_date=datetime.now() + timedelta(days=14),
    description="Submit your complete Software Requirements Specification document.",
    created_by=admin.id
))
db.add(Deadline(
    title="Mid Defense",
    due_date=datetime.now() + timedelta(days=45),
    description="Mid-year project defense presentation.",
    created_by=admin.id
))
 
db.commit()
db.close()
print("Database seeded successfully.")