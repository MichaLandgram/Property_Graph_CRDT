import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GraphError } from './GraphError';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GraphErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleDismiss = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError && this.state.error) {
            if (this.state.error instanceof GraphError) {
                return (
                    <div style={{ position: 'relative', width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
                       {/* We do NOT render children here to prevent re-execution of the error-causing code immediately. 
                           Instead we show a placeholder or the "crashed" state of the UI if possible, 
                           but since we can't safely render children, we show a nice error overlay on top of an empty or gray background 
                           or try to mimic the layout if possible. 
                           For now, the overlay is the content.
                        */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000
                        }}>
                            <div style={{
                                background: 'white',
                                padding: '30px',
                                borderRadius: '12px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                maxWidth: '400px',
                                textAlign: 'center',
                                border: '1px solid #ffd7d7'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
                                <h3 style={{ color: '#d32f2f', marginTop: 0, marginBottom: '10px' }}>Validation Error</h3>
                                <p style={{ color: '#555', lineHeight: '1.5', margin: '0 0 20px 0' }}>{this.state.error.message}</p>
                                <button
                                    onClick={this.handleDismiss}
                                    style={{
                                        background: '#2196F3',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = '#1976D2'}
                                    onMouseOut={(e) => e.currentTarget.style.background = '#2196F3'}
                                >
                                    Dismiss & Reset
                                </button>
                            </div>
                        </div>
                    </div>
                );
            }

            // System Error
            return (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    flexDirection: 'column',
                    background: '#f8f9fa',
                    color: '#333',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '40px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        maxWidth: '600px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '15px' }}>💣</div>
                        <h2 style={{ color: '#d32f2f', marginBottom: '10px', marginTop: 0 }}>System Error</h2>
                        <p style={{ marginBottom: '20px', color: '#666', lineHeight: '1.5' }}>
                            An unexpected error occurred. This is likely a bug in the application.
                        </p>
                        <div style={{ 
                            textAlign: 'left', 
                            background: '#2d2d2d', 
                            color: '#f8f8f2',
                            padding: '15px', 
                            borderRadius: '6px', 
                            overflow: 'auto', 
                            maxHeight: '200px', 
                            marginBottom: '25px',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                        }}>
                            {this.state.error.toString()}
                        </div>
                         <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: '#d32f2f',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
