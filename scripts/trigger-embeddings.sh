#!/bin/bash

echo "🚀 Triggering embedding generation for all drugs..."

# Get all drug set_ids
drug_ids=$(docker exec -i pharmaiq_postgres_1 psql -U pharmaiq -d pharmaiq_db -t -c "SELECT set_id FROM drugs WHERE status = 'published';")

count=0
for drug_id in $drug_ids; do
    drug_id=$(echo $drug_id | tr -d ' ')
    if [ ! -z "$drug_id" ]; then
        count=$((count + 1))
        echo "[$count] Processing drug: $drug_id"
        
        # Queue the embedding generation job directly via Redis
        docker exec -i pharmaiq_redis_1 redis-cli LPUSH "bull:ai-enhancement:wait" "{\"data\":{\"drugData\":{\"setId\":\"$drug_id\"}},\"opts\":{\"delay\":0,\"attempts\":3},\"name\":\"generate-embeddings\",\"timestamp\":$(date +%s)000,\"stacktrace\":[],\"returnvalue\":null}" > /dev/null
        
        echo "   ✅ Queued embedding generation"
        sleep 1
    fi
done

echo ""
echo "✅ Queued $count embedding generation jobs"
echo ""
echo "Waiting for processing to complete..."
sleep 10

# Check embedding count
echo "📊 Checking embedding statistics..."
docker exec -i pharmaiq_postgres_1 psql -U pharmaiq -d pharmaiq_db -c "SELECT COUNT(DISTINCT drug_id) as drugs_with_embeddings, COUNT(*) as total_embeddings FROM drug_embeddings;"