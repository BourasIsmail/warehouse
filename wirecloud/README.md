# WireCloud Integration for Smart Warehouse

This directory contains configuration files and documentation for integrating WireCloud dashboards with your Smart Warehouse Management system.

## What is WireCloud?

WireCloud is a FIWARE component that provides a web mashup platform allowing end users without programming skills to create web applications and dashboards. It's particularly useful for IoT applications as it allows you to:

- Create custom dashboards with drag-and-drop widgets
- Connect to real-time data sources (like your warehouse sensors)
- Build interactive visualizations without coding
- Share dashboards with other users

## Getting Started

### 1. Start WireCloud with Docker Compose

```bash
docker-compose -f wirecloud/docker-compose.wirecloud.yml up -d

