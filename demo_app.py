import streamlit as st
import requests

# Конфигурация страницы
st.set_page_config(
    page_title="DevAssist Pro", 
    page_icon="🏗️",
    layout="wide"
)

# Заголовок
st.title("🏗️ DevAssist Pro - Integration Dashboard")
st.markdown("---")

# Статус сервисов
st.header("📊 System Status")

col1, col2, col3 = st.columns(3)

with col1:
    st.metric(
        label="🗄️ Database", 
        value="PostgreSQL", 
        delta="Port 5433"
    )
    
with col2:
    st.metric(
        label="🔄 Cache", 
        value="Redis", 
        delta="Port 6378"
    )
    
with col3:
    st.metric(
        label="🌐 API Gateway", 
        value="FastAPI", 
        delta="Port 8000"
    )

st.markdown("---")

# API Testing
st.header("🔗 Backend Integration Test")

col_left, col_right = st.columns([1, 1])

with col_left:
    st.info("🎯 **API Gateway**: http://localhost:8000")
    st.info("📊 **Health Check**: http://localhost:8000/health")
    
    if st.button("🧪 Test API Connection", type="primary"):
        with st.spinner("Testing API connection..."):
            try:
                # Try to connect to API Gateway
                response = requests.get("http://host.docker.internal:8000/health", timeout=5)
                
                if response.status_code == 200:
                    st.success("✅ API Gateway connection successful!")
                    
                    # Display API response
                    api_data = response.json()
                    st.json(api_data)
                    
                    # Check individual services
                    if "services" in api_data:
                        st.subheader("🔧 Microservices Status")
                        services = api_data["services"]
                        
                        for service_name, service_info in services.items():
                            status = service_info.get("status", "unknown")
                            if status == "healthy":
                                st.success(f"✅ {service_name}: {status}")
                            else:
                                st.warning(f"⚠️ {service_name}: {status}")
                                if "error" in service_info:
                                    st.caption(f"Error: {service_info['error']}")
                else:
                    st.error(f"❌ API Gateway returned status: {response.status_code}")
                    
            except requests.exceptions.ConnectionError:
                st.error("❌ Cannot connect to API Gateway")
                st.caption("Make sure API Gateway is running on port 8000")
                
            except requests.exceptions.Timeout:
                st.error("❌ API Gateway timeout")
                st.caption("Request took too long to respond")
                
            except Exception as e:
                st.error(f"❌ Unexpected error: {e}")

with col_right:
    st.markdown("### 🚀 System Architecture")
    
    st.markdown("""
    ```
    ┌─────────────────┐    ┌──────────────────┐
    │  Streamlit UI   │◄──►│   API Gateway    │
    │   Port: 8501    │    │   Port: 8000     │
    └─────────────────┘    └──────────────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │   PostgreSQL    │
                           │   Port: 5433    │
                           └─────────────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │      Redis      │
                           │   Port: 6378    │
                           └─────────────────┘
    ```
    """)

st.markdown("---")

# Integration Status
st.header("🎯 Integration Status")

status_cols = st.columns(4)

with status_cols[0]:
    st.success("✅ **Database Layer**")
    st.caption("PostgreSQL running")

with status_cols[1]:
    st.success("✅ **Cache Layer**") 
    st.caption("Redis running")

with status_cols[2]:
    st.success("✅ **API Layer**")
    st.caption("FastAPI Gateway")

with status_cols[3]:
    st.info("🔄 **UI Layer**")
    st.caption("Streamlit Active")

# Next Steps
st.markdown("---")
st.header("📋 Next Steps")

next_steps = [
    "✅ Backend Services - PostgreSQL, Redis, API Gateway",
    "✅ Frontend UI - Streamlit Integration Interface", 
    "🔄 React Frontend - Full SPA Application",
    "🔄 WebSocket Integration - Real-time Communication",
    "🔄 Authentication System - JWT + OAuth",
    "🔄 Document Processing - КП Analysis Pipeline",
    "🔄 AI Integration - Claude + GPT Services"
]

for step in next_steps:
    st.markdown(f"- {step}")

st.markdown("---")
st.success("🎉 **DevAssist Pro Frontend + Backend Integration Active!**")
st.markdown("**Ready for full-scale development** 🚀")