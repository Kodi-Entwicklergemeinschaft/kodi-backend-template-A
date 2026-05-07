#!/bin/bash

# Docker Cleanup Script with Safety Prompts
# Prevents accidental data loss by requiring confirmation

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_usage() {
    echo -e "${BLUE}Docker Cleanup Utility${NC}"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  status      Show disk usage and container status"
    echo "  soft        Remove stopped containers, unused networks, dangling images"
    echo "  images      Remove all unused images (not just dangling)"
    echo "  full        Remove everything including volumes (DANGEROUS)"
    echo "  reset       Stop compose, remove volumes, and prune (DANGEROUS)"
    echo ""
    echo "Examples:"
    echo "  $0 status   # Safe - just shows info"
    echo "  $0 soft     # Mild cleanup, keeps images"
    echo "  $0 full     # Aggressive cleanup"
    echo ""
}

show_status() {
    echo -e "${BLUE}=== Docker Disk Usage ===${NC}"
    docker system df
    echo ""
    echo -e "${BLUE}=== Running Containers ===${NC}"
    docker compose ps 2>/dev/null || echo "No compose project running"
    echo ""
    echo -e "${BLUE}=== All Containers ===${NC}"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Size}}"
}

confirm_action() {
    local message=$1
    local danger_level=$2

    echo ""
    if [ "$danger_level" = "high" ]; then
        echo -e "${RED}⚠️  WARNING: This is a DESTRUCTIVE operation!${NC}"
    else
        echo -e "${YELLOW}⚠️  This will remove Docker resources.${NC}"
    fi
    echo ""
    echo -e "$message"
    echo ""
    read -p "Type 'yes' to confirm: " response

    if [ "$response" != "yes" ]; then
        echo -e "${YELLOW}Aborted.${NC}"
        exit 0
    fi
}

soft_cleanup() {
    echo -e "${BLUE}=== Soft Cleanup ===${NC}"
    echo "This will remove:"
    echo "  - Stopped containers"
    echo "  - Unused networks"
    echo "  - Dangling images"
    echo "  - Build cache"

    confirm_action "Proceed with soft cleanup?" "low"

    echo -e "${GREEN}Running cleanup...${NC}"
    docker system prune -f
    echo -e "${GREEN}✓ Soft cleanup complete${NC}"
}

images_cleanup() {
    echo -e "${BLUE}=== Images Cleanup ===${NC}"
    echo "This will remove:"
    echo "  - ALL unused images (not just dangling)"
    echo ""

    echo -e "${YELLOW}Current images:${NC}"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

    confirm_action "Remove all unused images?" "medium"

    echo -e "${GREEN}Running cleanup...${NC}"
    docker image prune -a -f
    echo -e "${GREEN}✓ Images cleanup complete${NC}"
}

full_cleanup() {
    echo -e "${RED}=== FULL Cleanup ===${NC}"
    echo "This will remove:"
    echo "  - ALL stopped containers"
    echo "  - ALL unused networks"
    echo "  - ALL unused images"
    echo "  - ALL unused volumes"
    echo "  - ALL build cache"
    echo ""
    echo -e "${RED}THIS INCLUDES DATABASE VOLUMES!${NC}"

    confirm_action "This will delete ALL Docker data. Are you absolutely sure?" "high"

    echo -e "${GREEN}Running full cleanup...${NC}"
    docker system prune -a -f --volumes
    echo -e "${GREEN}✓ Full cleanup complete${NC}"
}

reset_project() {
    echo -e "${RED}=== Project Reset ===${NC}"
    echo "This will:"
    echo "  1. Stop all compose services"
    echo "  2. Remove compose volumes"
    echo "  3. Run system prune"
    echo ""
    echo -e "${RED}ALL PROJECT DATA WILL BE LOST!${NC}"

    confirm_action "Reset the entire project? This cannot be undone!" "high"

    echo -e "${GREEN}Stopping services...${NC}"
    docker compose down -v
    echo -e "${GREEN}Running cleanup...${NC}"
    docker system prune -f
    echo -e "${GREEN}✓ Project reset complete${NC}"
}

# Main
case "${1:-}" in
    status)
        show_status
        ;;
    soft)
        soft_cleanup
        ;;
    images)
        images_cleanup
        ;;
    full)
        full_cleanup
        ;;
    reset)
        reset_project
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
