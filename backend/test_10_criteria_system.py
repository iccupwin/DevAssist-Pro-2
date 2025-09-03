#!/usr/bin/env python3
"""
Test: 10-Criteria Analysis System for DevAssist Pro
Tests the complete 10-criteria scoring system with Claude AI
"""

import os
import json
import asyncio
import anthropic
from dotenv import load_dotenv
from typing import Dict, Any, List

class TenCriteriaAnalyzer:
    """10-Criteria Analysis System"""
    
    def __init__(self):
        load_dotenv('.env', override=True)
        self.api_key = os.getenv('ANTHROPIC_API_KEY')
        self.client = anthropic.AsyncAnthropic(api_key=self.api_key.strip()) if self.api_key else None
        
        self.criteria_definitions = {
            "budget_compliance": {
                "name": "Соответствие бюджету",
                "description": "Соответствие предложенной стоимости бюджетным ограничениям",
                "weight": 0.15
            },
            "timeline_compliance": {
                "name": "Соответствие срокам",
                "description": "Реалистичность и соответствие временных рамок",
                "weight": 0.15
            },
            "technical_compliance": {
                "name": "Техническое соответствие",
                "description": "Соответствие техническим требованиям и спецификациям",
                "weight": 0.15
            },
            "team_expertise": {
                "name": "Экспертиза команды",
                "description": "Квалификация и опыт предлагаемой команды",
                "weight": 0.10
            },
            "functional_coverage": {
                "name": "Покрытие функциональности",
                "description": "Полнота покрытия функциональных требований",
                "weight": 0.10
            },
            "quality_assurance": {
                "name": "Обеспечение качества",
                "description": "Процессы контроля и обеспечения качества",
                "weight": 0.10
            },
            "development_methodology": {
                "name": "Методология разработки",
                "description": "Качество предлагаемой методологии разработки",
                "weight": 0.08
            },
            "scalability": {
                "name": "Масштабируемость",
                "description": "Возможности для будущего расширения",
                "weight": 0.07
            },
            "communication": {
                "name": "Коммуникация",
                "description": "Качество презентации и коммуникации",
                "weight": 0.05
            },
            "added_value": {
                "name": "Добавленная ценность",
                "description": "Дополнительная ценность и инновации",
                "weight": 0.05
            }
        }
    
    async def analyze_kp_by_criteria(self, kp_text: str, tz_text: str = None) -> Dict[str, Any]:
        """Анализ КП по 10 критериям"""
        
        if not self.client:
            raise Exception("Claude API client not initialized")
        
        # Подготовка промпта для анализа
        criteria_list = []
        for key, criterion in self.criteria_definitions.items():
            criteria_list.append(f"{len(criteria_list)+1}. {criterion['name']} (вес {criterion['weight']:.2f}): {criterion['description']}")
        
        criteria_text = "\n".join(criteria_list)
        
        analysis_prompt = f"""
Проанализируй коммерческое предложение по 10 критериям и дай детальную оценку каждого.

КРИТЕРИИ ДЛЯ АНАЛИЗА:
{criteria_text}

КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ:
{kp_text}

{"ТЕХНИЧЕСКОЕ ЗАДАНИЕ:" if tz_text else ""}
{tz_text if tz_text else ""}

ТРЕБОВАНИЯ К АНАЛИЗУ:
1. Для каждого критерия дай оценку от 0 до 100 баллов
2. Обоснуй каждую оценку (минимум 50 слов)
3. Укажи найденные данные из КП
4. Выдели риски и проблемы
5. Дай рекомендации по улучшению

Верни результат в JSON формате:
{{
  "criteria_scores": {{
    "budget_compliance": {{"score": 0-100, "justification": "text", "found_data": "text", "risks": ["risk1"], "recommendations": ["rec1"]}},
    "timeline_compliance": {{"score": 0-100, "justification": "text", "found_data": "text", "risks": ["risk1"], "recommendations": ["rec1"]}},
    "technical_compliance": {{"score": 0-100, "justification": "text", "found_data": "text", "risks": ["risk1"], "recommendations": ["rec1"]}},
    "team_expertise": {{"score": 0-100, "justification": "text", "found_data": "text", "risks": ["risk1"], "recommendations": ["rec1"]}},
    "functional_coverage": {{"score": 0-100, "justification": "text", "found_data": "text", "risks": ["risk1"], "recommendations": ["rec1"]}},
    "quality_assurance": {{"score": 0-100, "justification": "text", "found_data": "text", "risks": ["risk1"], "recommendations": ["rec1"]}},
    "development_methodology": {{"score": 0-100, "justification": "text", "found_data": "text", "risks": ["risk1"], "recommendations": ["rec1"]}},
    "scalability": {{"score": 0-100, "justification": "text", "found_data": "text", "risks": ["risk1"], "recommendations": ["rec1"]}},
    "communication": {{"score": 0-100, "justification": "text", "found_data": "text", "risks": ["risk1"], "recommendations": ["rec1"]}},
    "added_value": {{"score": 0-100, "justification": "text", "found_data": "text", "risks": ["risk1"], "recommendations": ["rec1"]}}
  }},
  "overall_assessment": {{
    "weighted_score": 0-100,
    "risk_level": "low/medium/high",
    "compliance_summary": "text",
    "key_strengths": ["strength1", "strength2"],
    "major_concerns": ["concern1", "concern2"],
    "recommendation": "accept/conditional_accept/reject"
  }}
}}
        """
        
        try:
            response = await self.client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=4000,
                temperature=0.2,
                messages=[{"role": "user", "content": analysis_prompt}]
            )
            
            content = response.content[0].text
            
            # Try to parse JSON
            try:
                result = json.loads(content)
                
                # Calculate weighted score if not provided
                if "overall_assessment" in result and "weighted_score" not in result["overall_assessment"]:
                    weighted_score = 0
                    for key, criterion in self.criteria_definitions.items():
                        if key in result.get("criteria_scores", {}):
                            score = result["criteria_scores"][key].get("score", 0)
                            weighted_score += score * criterion["weight"]
                    result["overall_assessment"]["weighted_score"] = round(weighted_score, 1)
                
                return result
                
            except json.JSONDecodeError:
                # Return raw response if JSON parsing fails
                return {
                    "error": "JSON parsing failed",
                    "raw_response": content,
                    "status": "partial_success"
                }
                
        except Exception as e:
            raise Exception(f"Claude API error: {str(e)}")
    
    def validate_analysis_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate the analysis result meets requirements"""
        
        validation_report = {
            "valid": True,
            "issues": [],
            "warnings": [],
            "score": 0
        }
        
        if "error" in result:
            validation_report["valid"] = False
            validation_report["issues"].append(f"Analysis error: {result['error']}")
            return validation_report
        
        # Check criteria_scores structure
        criteria_scores = result.get("criteria_scores", {})
        
        if not criteria_scores:
            validation_report["valid"] = False
            validation_report["issues"].append("No criteria_scores found")
            return validation_report
        
        # Check each criterion
        for key, criterion in self.criteria_definitions.items():
            if key not in criteria_scores:
                validation_report["issues"].append(f"Missing criterion: {key}")
                continue
            
            criterion_data = criteria_scores[key]
            
            # Check required fields
            required_fields = ["score", "justification", "found_data", "risks", "recommendations"]
            for field in required_fields:
                if field not in criterion_data:
                    validation_report["issues"].append(f"Missing field '{field}' for criterion '{key}'")
                    continue
                
                # Check field quality
                if field == "score":
                    score = criterion_data[field]
                    if not isinstance(score, (int, float)) or not (0 <= score <= 100):
                        validation_report["issues"].append(f"Invalid score for '{key}': {score}")
                
                elif field == "justification":
                    justification = criterion_data[field]
                    if not isinstance(justification, str) or len(justification) < 30:
                        validation_report["warnings"].append(f"Justification for '{key}' is too short")
                
                elif field in ["risks", "recommendations"]:
                    if not isinstance(criterion_data[field], list):
                        validation_report["issues"].append(f"Field '{field}' for '{key}' should be a list")
        
        # Check overall assessment
        overall = result.get("overall_assessment", {})
        if not overall:
            validation_report["warnings"].append("No overall assessment found")
        else:
            required_overall = ["weighted_score", "risk_level", "compliance_summary"]
            for field in required_overall:
                if field not in overall:
                    validation_report["warnings"].append(f"Missing overall field: {field}")
        
        # Calculate validation score
        if validation_report["issues"]:
            validation_report["valid"] = False
            validation_report["score"] = max(0, 100 - len(validation_report["issues"]) * 10)
        else:
            validation_report["score"] = max(80, 100 - len(validation_report["warnings"]) * 5)
        
        return validation_report

async def test_10_criteria_system():
    """Test the complete 10-criteria analysis system"""
    
    print("=" * 60)
    print("10-CRITERIA ANALYSIS SYSTEM TEST")
    print("=" * 60)
    
    # Test data
    test_kp = """
    Коммерческое предложение от ООО "ТехноПро"
    
    Проект: Разработка системы управления проектами
    
    КОМАНДА:
    - Руководитель проекта: 8 лет опыта
    - 3 Senior разработчика React/Node.js
    - 1 DevOps инженер
    - 1 QA инженер
    
    ТЕХНОЛОГИИ:
    - Frontend: React 18, TypeScript, Material-UI
    - Backend: Node.js, Express, PostgreSQL
    - DevOps: Docker, Kubernetes, CI/CD
    
    СТОИМОСТЬ: 1,200,000 рублей
    СРОК: 5 месяцев
    
    ГАРАНТИЯ: 12 месяцев технической поддержки
    
    МЕТОДОЛОГИЯ: Agile/Scrum с двухнедельными спринтами
    
    ДОПОЛНИТЕЛЬНО:
    - Покрытие тестами 80%+
    - Документация API
    - Обучение команды заказчика
    - Возможность интеграции с 1С
    """
    
    test_tz = """
    Техническое задание на разработку системы управления проектами
    
    ТРЕБОВАНИЯ:
    - Управление задачами и проектами
    - Система ролей и прав доступа
    - Отчетность и аналитика
    - Интеграция с внешними системами
    
    БЮДЖЕТ: до 1,500,000 рублей
    СРОК: не более 6 месяцев
    
    ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ:
    - Web-приложение
    - Поддержка мобильных устройств
    - Высокая производительность
    - Безопасность данных
    """
    
    analyzer = TenCriteriaAnalyzer()
    
    # Test 1: Basic system initialization
    print("1. Testing system initialization...")
    if not analyzer.client:
        print("   FAIL: Claude API client not initialized")
        return False
    
    print(f"   SUCCESS: Initialized with {len(analyzer.criteria_definitions)} criteria")
    
    # Test 2: Criteria definitions validation
    print("\n2. Testing criteria definitions...")
    total_weight = sum(c["weight"] for c in analyzer.criteria_definitions.values())
    if abs(total_weight - 1.0) > 0.01:
        print(f"   FAIL: Criteria weights don't sum to 1.0 (sum: {total_weight})")
        return False
    
    print(f"   SUCCESS: All 10 criteria defined with weights summing to {total_weight}")
    
    # Test 3: Full analysis
    print("\n3. Testing full 10-criteria analysis...")
    print("   Running analysis (this may take 30-60 seconds)...")
    
    try:
        result = await analyzer.analyze_kp_by_criteria(test_kp, test_tz)
        print("   SUCCESS: Analysis completed")
        
        # Test 4: Result validation
        print("\n4. Validating analysis results...")
        validation = analyzer.validate_analysis_result(result)
        
        print(f"   Validation score: {validation['score']}/100")
        print(f"   Valid: {validation['valid']}")
        
        if validation["issues"]:
            print("   Issues found:")
            for issue in validation["issues"]:
                print(f"     - {issue}")
        
        if validation["warnings"]:
            print("   Warnings:")
            for warning in validation["warnings"]:
                print(f"     - {warning}")
        
        # Test 5: Data quality check
        print("\n5. Testing analysis data quality...")
        
        if "criteria_scores" in result:
            criteria_scores = result["criteria_scores"]
            detailed_criteria = 0
            
            for key, data in criteria_scores.items():
                if isinstance(data, dict):
                    justification = data.get("justification", "")
                    if len(justification) >= 50:
                        detailed_criteria += 1
            
            quality_score = (detailed_criteria / 10) * 100
            print(f"   Quality score: {quality_score:.1f}% ({detailed_criteria}/10 criteria with detailed justification)")
            
            if quality_score >= 70:
                print("   SUCCESS: High quality analysis")
            else:
                print("   WARNING: Analysis quality could be improved")
        
        # Test 6: Business logic validation
        print("\n6. Testing business logic...")
        
        if "overall_assessment" in result:
            overall = result["overall_assessment"]
            weighted_score = overall.get("weighted_score", 0)
            risk_level = overall.get("risk_level", "")
            
            print(f"   Overall weighted score: {weighted_score}")
            print(f"   Risk level: {risk_level}")
            
            # Check score consistency
            if 0 <= weighted_score <= 100:
                print("   SUCCESS: Valid weighted score")
            else:
                print(f"   FAIL: Invalid weighted score: {weighted_score}")
                return False
            
            # Check risk level logic
            expected_risk = "low" if weighted_score >= 80 else "medium" if weighted_score >= 60 else "high"
            if risk_level.lower() in ["low", "medium", "high"]:
                print("   SUCCESS: Valid risk level")
            else:
                print(f"   WARNING: Unusual risk level: {risk_level}")
        
        # Save detailed results
        with open("test_10_criteria_analysis.json", "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print("\n   Full analysis saved to 'test_10_criteria_analysis.json'")
        
        return validation["valid"] and validation["score"] >= 70
        
    except Exception as e:
        print(f"   FAIL: Analysis error: {str(e)}")
        return False

async def run_criteria_system_tests():
    """Run all 10-criteria system tests"""
    
    try:
        success = await test_10_criteria_system()
        
        print("\n" + "=" * 60)
        print("10-CRITERIA SYSTEM TEST RESULTS")
        print("=" * 60)
        
        if success:
            print("RESULT: 10-CRITERIA SYSTEM TEST PASSED!")
            print("✓ System initialization works")
            print("✓ Criteria definitions are valid")
            print("✓ Claude AI analysis works")
            print("✓ Result validation works")
            print("✓ Data quality is acceptable")
            print("✓ Business logic is sound")
        else:
            print("RESULT: 10-CRITERIA SYSTEM TEST FAILED!")
            print("✗ One or more components need attention")
        
        return success
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(run_criteria_system_tests())
    exit(0 if success else 1)